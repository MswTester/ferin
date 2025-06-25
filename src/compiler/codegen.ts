import { CompiledResult } from '../types';

export class CodeGenerator {
  private target: 'web' | 'app';
  
  constructor(target: 'web' | 'app') {
    this.target = target;
  }
  
  generate(jsCode: string): CompiledResult {
    if (this.target === 'web') {
      return this.generateWebBundle(jsCode);
    } else {
      return this.generateAppBundle(jsCode);
    }
  }
  
  private generateWebBundle(jsCode: string): CompiledResult {
    const runtime = this.getWebRuntime();
    const finalJs = runtime + '\n\n' + jsCode + '\n\n' + this.getWebBootstrap();
    
    const css = this.generateCSS();
    
    return {
      js: finalJs,
      css
    };
  }
  
  private generateAppBundle(jsCode: string): CompiledResult {
    const runtime = this.getAppRuntime();
    const finalJs = runtime + '\n\n' + jsCode;
    
    return {
      js: finalJs
    };
  }
  
  private getWebRuntime(): string {
    return `
// Ferin Web Runtime
window.FerinRuntime = {
  // Reactive system
  reactive: function(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const reactive = new Proxy(obj, {
      set(target, key, value) {
        target[key] = value;
        // Trigger re-render
        if (window.FerinRuntime._currentComponent) {
          window.FerinRuntime._render();
        }
        return true;
      }
    });
    
    return reactive;
  },
  
  // Virtual DOM
  createElement: function(type, props, children) {
    return {
      type,
      props: props || {},
      children: children || []
    };
  },
  
  // Render function
  render: function(element, container) {
    if (!container) {
      container = document.getElementById('app') || document.body;
    }
    
    this._render = () => this._renderElement(element, container);
    this._render();
  },
  
  _renderElement: function(element, container) {
    if (typeof element === 'string' || typeof element === 'number') {
      container.textContent = element;
      return;
    }
    
    if (!element || !element.type) {
      return;
    }
    
    const dom = document.createElement(element.type);
    
    // Set attributes
    if (element.props) {
      for (const [key, value] of Object.entries(element.props)) {
        if (key.startsWith('on') && typeof value === 'function') {
          const eventType = key.slice(2).toLowerCase();
          dom.addEventListener(eventType, value);
        } else if (key === 'className' || key === 'class') {
          dom.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(dom.style, value);
        } else {
          dom.setAttribute(key, value);
        }
      }
    }
    
    // Render children
    if (element.children) {
      for (const child of element.children) {
        if (typeof child === 'string' || typeof child === 'number') {
          dom.appendChild(document.createTextNode(child));
        } else if (child && child.type) {
          const childDom = document.createElement('div');
          this._renderElement(child, childDom);
          if (childDom.children.length === 1) {
            dom.appendChild(childDom.firstChild);
          } else {
            dom.appendChild(childDom);
          }
        }
      }
    }
    
    container.innerHTML = '';
    container.appendChild(dom);
  }
};

// Component registry
window.FerinComponents = {};
`;
  }
  
  private getAppRuntime(): string {
    return `
// Ferin App Runtime
const { app, BrowserWindow } = require('electron');

const FerinRuntime = {
  // Window management
  Window: function(options = {}) {
    return {
      window: null,
      options: {
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        },
        ...options
      },
      
      load: function(content) {
        if (!this.window) {
          this.window = new BrowserWindow(this.options);
        }
        
        // Convert content to HTML if it's a virtual element
        const html = this._contentToHtml(content);
        this.window.loadDataURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      },
      
      _contentToHtml: function(content) {
        if (typeof content === 'string') {
          return content;
        }
        
        return \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ferin App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    // Runtime code here
    const element = \${JSON.stringify(content)};
    // Render element to DOM
  </script>
</body>
</html>
\`;
      }
    };
  },
  
  // Process management
  process: {
    mount: async function(window) {
      // Mount window to the app
      return new Promise(resolve => {
        if (app.isReady()) {
          resolve();
        } else {
          app.whenReady().then(resolve);
        }
      });
    },
    
    exit: function() {
      app.quit();
    }
  },
  
  // Reactive system (similar to web but for Electron)
  reactive: function(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    return new Proxy(obj, {
      set(target, key, value) {
        target[key] = value;
        return true;
      }
    });
  },
  
  createElement: function(type, props, children) {
    return {
      type,
      props: props || {},
      children: children || []
    };
  }
};

module.exports = FerinRuntime;
`;
  }
  
  private getWebBootstrap(): string {
    return `
// Auto-start the application
(function() {
  if (typeof main === 'function') {
    document.addEventListener('DOMContentLoaded', function() {
      try {
        main();
      } catch (error) {
        console.error('Ferin app error:', error);
      }
    });
  }
})();
`;
  }
  
  private generateCSS(): string {
    return `
/* Ferin Default Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
}

/* Utility classes for common layouts */
.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.justify-center {
  justify-content: center;
}

.align-center {
  align-items: center;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.p-1 {
  padding: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.p-4 {
  padding: 1rem;
}

.m-1 {
  margin: 0.25rem;
}

.m-2 {
  margin: 0.5rem;
}

.m-4 {
  margin: 1rem;
}

.absolute {
  position: absolute;
}

.relative {
  position: relative;
}
`;
  }
}