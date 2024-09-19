---
title: "mpxjs开发记录4——接口对接"
description: "mpxjs开发记录"
pubDate: "Sep 19 2024"
heroImage: "/blog-placeholder-1.jpg"
---

### 实现和 jsonrpc 接口的对接

项目中使用了一些特殊的方式来处理接口对接。
下面是实现把原生代码转换成 mpx 项目中可以运行的代码的过程。(主要就是把js文件转换成ts文件)

### 代码展示

| mpx 项目的原始代码

```
<template></template>

<script lang="ts">
  import { createPage } from '@mpxjs/core'

  createPage({
    onLoad() {
      //
    }
  })
</script>

<script type="application/json">
  {
    "usingComponents": {}
  }
</script>
```

| 原生小程序的接口 API 封装部分代码

```
// connect.js
const config = {
  rpcURL: wx.mew.conf.rpcURL,
  participateAPI: wx.mew.conf.participateRPC
};

class RpcClient {
  constructor() {
    this.cookie = wx.getStorageSync('mew.rpc.cookie');
    if (this.cookie) {
      try {
        this.cookie = JSON.parse(this.cookie);
      } catch (error) {
        // Do nothing
      }
    }
    this.acquireListeners = [];
  }
  directRPC(method, parameters, callback) {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    wx.request({
      url: config.rpcURL,
      method: 'POST',
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: parameters,
        id: new Date().getTime().toString() + '.' + Math.round(Math.random() * 0xffff)
      }),
      header: headers,
      fail: callback,
      success: (result) => {
        try {
          var response = result.data;
          let cookie = Object.keys(result.header).filter((key) => /^set\-cookie$/i.test(key))[0];

          if (cookie) {
            this.cookie = result.header[cookie].split(';')[0];
            wx.setStorageSync('mew.rpc.cookie', JSON.stringify(this.cookie));
          }

          if (!response) {
            callback(new Error('Empty result data'));
            return;
          }

          if (response.error) {
            let error = new Error(response.error.msg);
            error.code = response.error.code;
            callback(error);
            return;
          }

          callback(null, response.result);
        } catch (error) {
          wx.mew.log.error(error);
          callback(error);
        }
      }
    });
  }
  rpc(method, parameters, callback) {
    if (this.acquireListeners.length) {
      this.acquireListeners.push(
        function () {
          this.directRPC(method, parameters, callback);
        }.bind(this)
      );
    } else {
      this.directRPC(method, parameters, (error, result) => {
        if (error && error.code == RpcClient.ERROR_NEED_TOKEN) {
          this.acquireToken((error, _result) => {
            if (error) {
              callback(error);
            } else {
              this.directRPC(method, parameters, callback);
            }
          });
        } else {
          callback(error, result);
        }
      });
    }
  }
  acquireToken(callback) {
    let client = this;
    client.acquireListeners.push(callback);
    if (client.acquireListeners.length == 1) {
      let login = wx.login;
      let times = wx.mew.conf.loginRetries;
      if (typeof times !== 'number') {
        times = 1;
      }
      if (times < 1) {
        times = 1;
      }
      const tryLogin = (error) => {
        --times;
        if (times < 0) {
          if (!error) {
            error = new Error('Unknown Error');
          }
          var listeners = client.acquireListeners.slice(0);
          client.acquireListeners.length = 0;
          listeners.forEach(function (listener) {
            try {
              listener(error);
            } catch (error) {
              wx.mew.log.error(error);
            }
          });
          return;
        }
        login({
          success: (res) => {
            if (res.code) {
              this.directRPC(config.paticipantAPI, [res.code], function (error, result) {
                if (error) {
                  tryLogin(error);
                  return;
                }
                const listeners = client.acquireListeners.slice(0);
                client.acquireListeners.length = 0;
                listeners.forEach(function (listener) {
                  try {
                    listener(null, result);
                  } catch (error) {
                    wx.mew.log.error(error);
                  }
                });
              });
            } else {
              const listeners = client.acquireListeners.slice(0);
              client.acquireListeners.length = 0;
              listeners.forEach(function (listener) {
                let error = new Error(res.errMsg);
                try {
                  listener(error);
                } catch (error) {
                  wx.mew.log.error(error);
                }
              });
            }
          },
          fail: (res) => {
            const listeners = client.acquireListeners.slice(0);
            client.acquireListeners.length = 0;
            listeners.forEach(function (listener) {
              let error = new Error(res.errMsg);
              try {
                listener(error);
              } catch (error) {
                wx.mew.log.error(error);
              }
            });
          }
        });
      };
      tryLogin();
    }
  }
}

RpcClient.ERROR_NEED_TOKEN = 592;
const rpcClient = new RpcClient();

const buildProxy = function (name, context) {
  return new Proxy(
    function () {
      const parameters = Array.prototype.slice.call(arguments, 0);
      return new Promise(function (resolve, reject) {
        rpcClient.rpc(context.join('@') + '.' + name, parameters, function (error, result) {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    },
    {
      get(target, method) {
        if (!target[method]) {
          target[method] = buildProxy(method, context.concat([name]));
        }
        return target[method];
      }
    }
  );
};

export const rpc = new Proxy(
  {},
  {
    get(target, domain) {
      if (!target[domain]) {
        target[domain] = new Proxy(
          {},
          {
            get(subTarget, method) {
              if (['bind', 'length', 'name'].indexOf(method) < 0) {
                if (!subTarget[method]) {
                  subTarget[method] = buildProxy(method, [domain]);
                }
                return subTarget[method];
              } else {
                return subTarget[method];
              }
            }
          }
        );
      }
      return target[domain];
    }
  }
);

wx.mew.rpc = rpc;
```
在src目录下新建utils/connect.ts文件用于存放接口处理函数。具体代码如下：
```

declare const wx: {
  getStorageSync(key: string): string | null;
  setStorageSync(key: string, value: string): void;
  request(options: {
    url: string;
    method: string;
    data: string;
    header: { [key: string]: string };
    success: (result: { data: RpcResponse; header: { [key: string]: string } }) => void;
    fail: (error: Error) => void;
  }): void;
  login(options: {
    success: (res: { code: string; errMsg: string }) => void;
    fail: (res: { errMsg: string }) => void;
  }): void;
};

const config = {
  rpcURL: 'https://mini.tuodanlab.com/gateway/api/jsonrpc.jsp',
  participateAPI: 'blind@mini.paticipant'
};

interface RpcResponse {
  jsonrpc: string;
  result?: any;
  error?: { code: number; msg: string };
}

class RpcClient {
  static ERROR_NEED_TOKEN = 592; 
  private cookie: string | null;
  private acquireListeners: Array<(error: Error | null, result?: any) => void>;

  constructor() {
    this.cookie = wx.getStorageSync('mew.rpc.cookie');
    if (this.cookie) {
      try {
        this.cookie = JSON.parse(this.cookie);
      } catch (error) {
        // Do nothing
      }
    }
    this.acquireListeners = [];
  }

  directRPC(method: string, parameters: any[], callback: (error: Error | null, result?: any) => void) {
    let headers: { [key: string]: string } = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    wx.request({
      url: config.rpcURL,
      method: 'POST',
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: parameters,
        id: new Date().getTime().toString() + '.' + Math.round(Math.random() * 0xffff)
      }),
      header: headers,
      fail: callback,
      success: (result: {data: RpcResponse; header: { [key: string]: string}}) => {
        try {
          const response: RpcResponse = result.data;
          const cookie = Object.keys(result.header).filter((key) => /^set\-cookie$/i.test(key))[0];

          if (cookie) {
            this.cookie = result.header[cookie].split(';')[0];
            wx.setStorageSync('mew.rpc.cookie', JSON.stringify(this.cookie));
          }

          if (!response) {
            callback(new Error('Empty result data'));
            return;
          }

          if (response.error) {
            const error = new Error(response.error.msg);
            (error as any).code = response.error.code;
            callback(error);
            return;
          }

          callback(null, response.result);
        } catch (error) {
          console.log(error);
          callback(error);
        }
      }
    });
  }

  rpc(method: string, parameters: any[], callback: (error: Error | null, result?: any) => void) {
    if (this.acquireListeners.length) {
      this.acquireListeners.push(() => {
        this.directRPC(method, parameters, callback);
      });
    } else {
      this.directRPC(method, parameters, (error, result) => {
        if (error && (error as any).code == RpcClient.ERROR_NEED_TOKEN) {
          this.acquireToken((error, _result) => {
            if (error) {
              callback(error);
            } else {
              this.directRPC(method, parameters, callback);
            }
          });
        } else {
          callback(error, result);
        }
      });
    }
  }

  acquireToken(callback: (error: Error | null, result?: any) => void) {
    const client = this;
    client.acquireListeners.push(callback);
    if (client.acquireListeners.length == 1) {
      const login = wx.login;
      let times = 1;
      if (typeof times !== 'number') {
        times = 1;
      }
      if (times < 1) {
        times = 1;
      }
      const tryLogin = (error?: Error) => {
        --times;
        if (times < 0) {
          if (!error) {
            error = new Error('Unknown Error');
          }
          const listeners = client.acquireListeners.slice(0);
          client.acquireListeners.length = 0;
          listeners.forEach((listener) => {
            try {
              listener(error || new Error('Unknown Error'));
            } catch (error) {
              console.log(error);
            }
          });
          return;
        }
        login({
          success: (res: { code: string; errMsg: string }) => {
            if (res.code) {
              this.directRPC(config.participateAPI, [res.code], (error, result) => {
                if (error) {
                  tryLogin(error);
                  return;
                }
                const listeners = client.acquireListeners.slice(0);
                client.acquireListeners.length = 0;
                listeners.forEach((listener) => {
                  try {
                    listener(null, result);
                  } catch (error) {
                    console.log(error);
                  }
                });
              });
            } else {
              const listeners = client.acquireListeners.slice(0);
              client.acquireListeners.length = 0;
              listeners.forEach((listener) => {
                const error = new Error(res.errMsg);
                try {
                  listener(error);
                } catch (error) {
                  console.log(error);
                }
              });
            }
          },
          fail: (res: { errMsg: string }) => {
            const listeners = client.acquireListeners.slice(0);
            client.acquireListeners.length = 0;
            listeners.forEach((listener) => {
              const error = new Error(res.errMsg);
              try {
                listener(error);
              } catch (error) {
                console.log(error);
              }
            });
          }
        });
      };
      tryLogin();
    }
  }
}

const rpcClient = new RpcClient();

const buildProxy = function (name: string, context: string[]): any {
  return new Proxy(
    function () {
      const parameters = Array.prototype.slice.call(arguments, 0);
      return new Promise((resolve, reject) => {
        rpcClient.rpc(context.join('@') + '.' + name, parameters, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    },
    {
      get(target: any, method: string) {
        if (!target[method]) {
          target[method] = buildProxy(method, context.concat([name]));
        }
        return target[method];
      }
    }
  );
};

export const rpc = new Proxy(
  {},
  {
    get(target: { [key: string]: any }, domain: string) {
      if (!target[domain]) {
        target[domain] = new Proxy(
          {},
          {
            get(subTarget: Record<string, any>, method: string) {
              if (['bind', 'length', 'name'].indexOf(method) < 0) {
                if (!subTarget[method]) {
                  subTarget[method] = buildProxy(method, [domain]);
                }
                return subTarget[method];
              } else {
                return subTarget[method];
              }
            }
          }
        );
      }
      return target[domain];
    }
  }
);
```