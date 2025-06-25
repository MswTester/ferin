import { Program, Statement, Expression, VariableDeclaration, FunctionDeclaration, ClassDeclaration, IfStatement, ForStatement, WhileStatement, LoopStatement, ReturnStatement, ImportDeclaration, ExportDeclaration, ComponentDeclaration, JSXElement, BinaryExpression, UnaryExpression, CallExpression, MemberExpression, Identifier, Literal, ArrayExpression, ObjectExpression } from '../types';

export class Transformer {
  private target: 'web' | 'app';
  private components: Map<string, ComponentDeclaration> = new Map();
  private imports: string[] = [];
  private exports: string[] = [];
  private lastReturnStatement: ReturnStatement | null = null;
  private hasProcessMount: boolean = false;
  
  constructor(target: 'web' | 'app') {
    this.target = target;
  }
  
  transform(ast: Program): string {
    let output = '';
    
    // Add runtime imports
    if (this.target === 'web') {
      output += 'const { createElement, render, reactive } = window.FerinRuntime;\n';
    } else {
      output += 'const { Window, process } = require("electron");\n';
      output += 'const { createElement, render, reactive } = require("./ferin-runtime");\n';
    }
    
    // Process statements and track return statements and process.mount calls
    for (const statement of ast.body) {
      this.analyzeStatement(statement);
      output += this.transformStatement(statement);
    }
    
    // Validate based on target
    this.validateForTarget();
    
    // Add component registration
    if (this.components.size > 0) {
      output += '\n// Component registrations\n';
      for (const [name, comp] of this.components) {
        output += `window.FerinComponents = window.FerinComponents || {};\n`;
        output += `window.FerinComponents['${name}'] = ${name};\n`;
      }
    }
    
    // Auto-render for web target if there's a last return statement
    if (this.target === 'web' && this.lastReturnStatement && this.lastReturnStatement.value) {
      output += '\n// Auto-render the last returned component\n';
      output += `window.FerinRuntime.render(${this.transformExpression(this.lastReturnStatement.value)});\n`;
    }
    
    return output;
  }
  
  private analyzeStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'ReturnStatement':
        // Track the last return statement at the top level
        this.lastReturnStatement = stmt as ReturnStatement;
        break;
      case 'FunctionDeclaration':
        // Analyze function body for return statements and process.mount calls
        const funcDecl = stmt as FunctionDeclaration;
        for (const bodyStmt of funcDecl.body) {
          this.analyzeStatementRecursive(bodyStmt);
        }
        break;
      case 'ExpressionStatement':
        // Check expression statements for call expressions
        const exprStmt = stmt as any;
        if (exprStmt.expression && exprStmt.expression.type === 'CallExpression') {
          this.analyzeCallExpression(exprStmt.expression);
        }
        break;
      case 'CallExpression':
        // Check for process.mount calls
        this.analyzeCallExpression(stmt as any);
        break;
      default:
        this.analyzeStatementRecursive(stmt);
        break;
    }
  }
  
  private analyzeStatementRecursive(stmt: Statement): void {
    switch (stmt.type) {
      case 'ExpressionStatement':
        // Check expression statements for call expressions
        const exprStmt = stmt as any;
        if (exprStmt.expression && exprStmt.expression.type === 'CallExpression') {
          this.analyzeCallExpression(exprStmt.expression);
        }
        break;
      case 'CallExpression':
        this.analyzeCallExpression(stmt as any);
        break;
      case 'IfStatement':
        const ifStmt = stmt as IfStatement;
        for (const consequentStmt of ifStmt.consequent) {
          this.analyzeStatementRecursive(consequentStmt);
        }
        if (ifStmt.alternate) {
          if (Array.isArray(ifStmt.alternate)) {
            for (const alternateStmt of ifStmt.alternate) {
              this.analyzeStatementRecursive(alternateStmt);
            }
          } else {
            this.analyzeStatementRecursive(ifStmt.alternate as Statement);
          }
        }
        break;
      case 'ForStatement':
        const forStmt = stmt as ForStatement;
        for (const bodyStmt of forStmt.body) {
          this.analyzeStatementRecursive(bodyStmt);
        }
        break;
      case 'WhileStatement':
        const whileStmt = stmt as WhileStatement;
        for (const bodyStmt of whileStmt.body) {
          this.analyzeStatementRecursive(bodyStmt);
        }
        break;
      case 'LoopStatement':
        const loopStmt = stmt as LoopStatement;
        for (const bodyStmt of loopStmt.body) {
          this.analyzeStatementRecursive(bodyStmt);
        }
        break;
    }
  }
  
  private analyzeCallExpression(expr: CallExpression): void {
    if (expr.callee && expr.callee.type === 'MemberExpression') {
      const memberExpr = expr.callee as MemberExpression;
      if (memberExpr.object && memberExpr.object.type === 'Identifier' && 
          (memberExpr.object as Identifier).name === 'process' &&
          memberExpr.property && memberExpr.property.type === 'Identifier' &&
          (memberExpr.property as Identifier).name === 'mount') {
        this.hasProcessMount = true;
      }
    }
  }
  
  private validateForTarget(): void {
    if (this.target === 'web') {
      if (!this.lastReturnStatement || !this.lastReturnStatement.value) {
        throw new Error('Web target requires a component to be returned at the top level. Please add a return statement with a component.');
      }
    } else if (this.target === 'app') {
      if (!this.hasProcessMount) {
        throw new Error('App target requires at least one process.mount() call. Please mount at least one window using process.mount().');
      }
    }
  }
  
  private transformStatement(stmt: Statement): string {
    switch (stmt.type) {
      case 'VariableDeclaration':
        return this.transformVariableDeclaration(stmt as VariableDeclaration);
      case 'FunctionDeclaration':
        return this.transformFunctionDeclaration(stmt as FunctionDeclaration);
      case 'ClassDeclaration':
        return this.transformClassDeclaration(stmt as ClassDeclaration);
      case 'IfStatement':
        return this.transformIfStatement(stmt as IfStatement);
      case 'ForStatement':
        return this.transformForStatement(stmt as ForStatement);
      case 'WhileStatement':
        return this.transformWhileStatement(stmt as WhileStatement);
      case 'LoopStatement':
        return this.transformLoopStatement(stmt as LoopStatement);
      case 'ReturnStatement':
        return this.transformReturnStatement(stmt as ReturnStatement);
      case 'ImportDeclaration':
        return this.transformImportDeclaration(stmt as ImportDeclaration);
      case 'ExportDeclaration':
        return this.transformExportDeclaration(stmt as ExportDeclaration);
      case 'ComponentDeclaration':
        return this.transformComponentDeclaration(stmt as ComponentDeclaration);
      case 'JSXElement':
        return this.transformJSXElement(stmt as JSXElement) + ';\n';
      default:
        if ('type' in stmt && typeof stmt === 'object') {
          return this.transformExpression(stmt as Expression) + ';\n';
        }
        return '';
    }
  }
  
  private transformVariableDeclaration(stmt: VariableDeclaration): string {
    let output = `let ${stmt.identifier}`;
    
    if (stmt.initializer) {
      const init = this.transformExpression(stmt.initializer);
      output += ` = reactive(${init})`;
    }
    
    return output + ';\n';
  }
  
  private transformFunctionDeclaration(stmt: FunctionDeclaration): string {
    const asyncPrefix = stmt.isAsync ? 'async ' : '';
    let output = `${asyncPrefix}function ${stmt.name}(`;
    
    const params = stmt.parameters.map(param => {
      let paramStr = param.name;
      if (param.defaultValue) {
        paramStr += ` = ${this.transformExpression(param.defaultValue)}`;
      }
      return paramStr;
    }).join(', ');
    
    output += params + ') {\n';
    
    for (const bodyStmt of stmt.body) {
      output += '  ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n  ');
    }
    
    output += '}\n\n';
    return output;
  }
  
  private transformClassDeclaration(stmt: ClassDeclaration): string {
    let output = `class ${stmt.name}`;
    
    if (stmt.superClass) {
      output += ` extends ${stmt.superClass}`;
    }
    
    output += ' {\n';
    
    for (const member of stmt.body) {
      const memberAny = member as any;
      if (member.type === 'MethodDefinition') {
        const staticPrefix = memberAny.isStatic ? 'static ' : '';
        const asyncPrefix = memberAny.isAsync ? 'async ' : '';
        const methodName = memberAny.isConstructor ? 'constructor' : memberAny.name;
        
        output += `  ${staticPrefix}${asyncPrefix}${methodName}(`;
        
        const params = memberAny.parameters.map((param:any) => {
          let paramStr = param.name;
          if (param.defaultValue) {
            paramStr += ` = ${this.transformExpression(param.defaultValue)}`;
          }
          return paramStr;
        }).join(', ');
        
        output += params + ') {\n';
        
        for (const bodyStmt of memberAny.body) {
          output += '    ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n    ');
        }
        
        output += '  }\n\n';
      } else if (member.type === 'PropertyDefinition') {
        const staticPrefix = memberAny.isStatic ? 'static ' : '';
        output += `  ${staticPrefix}${memberAny.name}`;
        
        if (memberAny.initializer) {
          output += ` = ${this.transformExpression(memberAny.initializer)}`;
        }
        
        output += ';\n';
      }
    }
    
    output += '}\n\n';
    return output;
  }
  
  private transformIfStatement(stmt: IfStatement): string {
    let output = `if (${this.transformExpression(stmt.condition)}) {\n`;
    
    for (const consequentStmt of stmt.consequent) {
      output += '  ' + this.transformStatement(consequentStmt).replace(/\n/g, '\n  ');
    }
    
    output += '}';
    
    if (stmt.alternate) {
      if (Array.isArray(stmt.alternate)) {
        output += ' else {\n';
        for (const alternateStmt of stmt.alternate) {
          output += '  ' + this.transformStatement(alternateStmt).replace(/\n/g, '\n  ');
        }
        output += '}';
      } else {
        output += ' else ' + this.transformIfStatement(stmt.alternate);
      }
    }
    
    return output + '\n';
  }
  
  private transformForStatement(stmt: ForStatement): string {
    if (stmt.isOf) {
      let output = `for (const [${stmt.variable}`;
      if (stmt.index) {
        output += `, ${stmt.index}`;
      }
      output += `] of Object.entries(${this.transformExpression(stmt.iterable)})) {\n`;
      
      for (const bodyStmt of stmt.body) {
        output += '  ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n  ');
      }
      
      return output + '}\n';
    } else {
      let output = `for (let ${stmt.index || 'i'} = 0; ${stmt.index || 'i'} < ${this.transformExpression(stmt.iterable)}.length; ${stmt.index || 'i'}++) {\n`;
      output += `  const ${stmt.variable} = ${this.transformExpression(stmt.iterable)}[${stmt.index || 'i'}];\n`;
      
      for (const bodyStmt of stmt.body) {
        output += '  ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n  ');
      }
      
      return output + '}\n';
    }
  }
  
  private transformWhileStatement(stmt: WhileStatement): string {
    let output = `while (${this.transformExpression(stmt.condition)}) {\n`;
    
    for (const bodyStmt of stmt.body) {
      output += '  ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n  ');
    }
    
    return output + '}\n';
  }
  
  private transformLoopStatement(stmt: LoopStatement): string {
    let output = 'while (true) {\n';
    
    for (const bodyStmt of stmt.body) {
      output += '  ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n  ');
    }
    
    output += '  await new Promise(resolve => setTimeout(resolve, 0));\n';
    return output + '}\n';
  }
  
  private transformReturnStatement(stmt: ReturnStatement): string {
    if (stmt.value) {
      return `return ${this.transformExpression(stmt.value)};\n`;
    }
    return 'return;\n';
  }
  
  private transformImportDeclaration(stmt: ImportDeclaration): string {
    let output = '';
    
    for (const spec of stmt.specifiers) {
      if (spec.type === 'ImportDefaultSpecifier') {
        output += `const ${spec.local} = require('${stmt.source}');\n`;
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        output += `const ${spec.local} = require('${stmt.source}');\n`;
      } else {
        output += `const { ${spec.imported} } = require('${stmt.source}');\n`;
        if (spec.imported !== spec.local) {
          output += `const ${spec.local} = ${spec.imported};\n`;
        }
      }
    }
    
    return output;
  }
  
  private transformExportDeclaration(stmt: ExportDeclaration): string {
    if (stmt.isDefault && stmt.declaration) {
      return `module.exports = ${this.transformStatement(stmt.declaration).replace(/;\n$/, '')};\n`;
    }
    
    if (stmt.specifiers) {
      let output = 'module.exports = {\n';
      for (const spec of stmt.specifiers) {
        output += `  ${spec.exported}: ${spec.local},\n`;
      }
      output += '};\n';
      return output;
    }
    
    if (stmt.declaration) {
      const declOutput = this.transformStatement(stmt.declaration);
      // Extract the name from the declaration to export it
      if (stmt.declaration.type === 'FunctionDeclaration') {
        const funcDecl = stmt.declaration as FunctionDeclaration;
        return declOutput + `module.exports.${funcDecl.name} = ${funcDecl.name};\n`;
      } else if (stmt.declaration.type === 'ClassDeclaration') {
        const classDecl = stmt.declaration as ClassDeclaration;
        return declOutput + `module.exports.${classDecl.name} = ${classDecl.name};\n`;
      }
      return declOutput;
    }
    
    return '';
  }
  
  private transformComponentDeclaration(stmt: ComponentDeclaration): string {
    this.components.set(stmt.name, stmt);
    
    let output = `function ${stmt.name}(props, children) {\n`;
    
    // Add reactive properties
    for (const param of stmt.parameters) {
      if (param.name !== 'props' && param.name !== 'children') {
        output += `  let ${param.name} = reactive(props.${param.name});\n`;
      }
    }
    
    // Transform body statements
    let hasReturn = false;
    for (const bodyStmt of stmt.body) {
      if (bodyStmt.type === 'ReturnStatement') {
        hasReturn = true;
        const returnValue = (bodyStmt as ReturnStatement).value;
        if (returnValue && returnValue.type === 'JSXElement') {
          output += '  return ' + this.transformJSXElement(returnValue as JSXElement) + ';\n';
        } else if (returnValue) {
          output += '  return ' + this.transformExpression(returnValue) + ';\n';
        } else {
          output += '  return;\n';
        }
      } else {
        output += '  ' + this.transformStatement(bodyStmt).replace(/\n/g, '\n  ');
      }
    }
    
    if (!hasReturn) {
      output += '  return null;\n';
    }
    
    output += '}\n\n';
    return output;
  }
  
  private transformJSXElement(expr: JSXElement): string {
    const tagName = expr.tagName;
    const attrs: string[] = [];
    const children: string[] = [];
    
    // Handle attributes
    for (const attr of expr.attributes) {
      if (attr.value) {
        if (typeof attr.value === 'string') {
          attrs.push(`${attr.name}: "${attr.value}"`);
        } else {
          attrs.push(`${attr.name}: ${this.transformExpression(attr.value)}`);
        }
      } else {
        attrs.push(`${attr.name}: true`);
      }
    }
    
    // Handle children
    for (const child of expr.children) {
      if (typeof child === 'string') {
        children.push(`"${child}"`);
      } else if ('type' in child && child.type === 'JSXElement') {
        children.push(this.transformJSXElement(child as JSXElement));
      } else {
        children.push(this.transformExpression(child as Expression));
      }
    }
    
    const attrsStr = attrs.length > 0 ? `{ ${attrs.join(', ')} }` : 'null';
    const childrenStr = children.length > 0 ? `[${children.join(', ')}]` : '[]';
    
    return `createElement("${tagName}", ${attrsStr}, ${childrenStr})`;
  }
  
  private transformExpression(expr: Expression): string {
    switch (expr.type) {
      case 'Identifier':
        const id = expr as Identifier;
        if (id.name === 'self') {
          return 'this';
        }
        return id.name;
      
      case 'Literal':
        const lit = expr as Literal;
        if (typeof lit.value === 'string') {
          return `"${lit.value}"`;
        }
        return String(lit.value);
      
      case 'BinaryExpression':
        const bin = expr as BinaryExpression;
        let op = bin.operator;
        if (op === '**') op = '**';
        return `(${this.transformExpression(bin.left)} ${op} ${this.transformExpression(bin.right)})`;
      
      case 'UnaryExpression':
        const unary = expr as UnaryExpression;
        return `${unary.operator}${this.transformExpression(unary.operand)}`;
      
      case 'CallExpression':
        const call = expr as CallExpression;
        const callee = this.transformExpression(call.callee);
        const args = call.arguments.map(arg => this.transformExpression(arg)).join(', ');
        
        // Handle special function calls
        if (callee === 'log') {
          return `console.log(${args})`;
        }
        
        return `${callee}(${args})`;
      
      case 'MemberExpression':
        const member = expr as MemberExpression;
        const object = this.transformExpression(member.object);
        const property = member.computed ? 
          `[${this.transformExpression(member.property)}]` : 
          `.${this.transformExpression(member.property)}`;
        return object + property;
      
      case 'ArrayExpression':
        const arr = expr as ArrayExpression;
        const elements = arr.elements.map(el => this.transformExpression(el)).join(', ');
        return `[${elements}]`;
      
      case 'ObjectExpression':
        const obj = expr as ObjectExpression;
        const props = obj.properties.map(prop => 
          `${this.transformExpression(prop.key)}: ${this.transformExpression(prop.value)}`
        ).join(', ');
        return `{${props}}`;
      
      case 'JSXElement':
        return this.transformJSXElement(expr as JSXElement);
      
      default:
        return 'null';
    }
  }
}