import { transform } from 'sucrase';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';
const JsxParser = Parser.extend(jsx());
// acorn проверяет синтаксис строго (в том числе парность JSX-тегов), sucrase переводит JSX в обычный JS
window.Sucrase = { transform, validate: (code) => { JsxParser.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }); } };
