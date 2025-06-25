import { Lexer } from './lexer';
import { Parser } from './parser';
import { Transformer } from './transformer';
import { CodeGenerator } from './codegen';
import { CompiledResult } from '../types';

export async function compile(source: string, target: 'web' | 'app' = 'web'): Promise<CompiledResult> {
  try {
    // Lexical analysis
    const lexer = new Lexer(source);
    let tokens = lexer.tokenize();
    
    // Handle indentation
    tokens = lexer.handleIndentation(tokens);
    
    // Parsing
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    // Transformation
    const transformer = new Transformer(target);
    const jsCode = transformer.transform(ast);
    
    // Code generation
    const codeGen = new CodeGenerator(target);
    const result = codeGen.generate(jsCode);
    
    return result;
  } catch (error) {
    throw new Error(`Compilation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export { Lexer, Parser, Transformer, CodeGenerator };