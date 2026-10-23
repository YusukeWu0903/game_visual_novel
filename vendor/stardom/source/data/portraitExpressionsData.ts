import {getRuntimeContent} from './runtimeContent.js';
import type {ExpressionTypeData,CharacterExpressionData} from '../core/PortraitExpressions.js';
export const EXPRESSION_TYPES:ExpressionTypeData[]=getRuntimeContent('expressionTypes',()=>([{"id":"ExpressionType0001","enabled":true,"code":0,"nameStringId":"String40139"},{"id":"ExpressionType0002","enabled":true,"code":1,"nameStringId":"String40140"}]));
export const CHARACTER_EXPRESSIONS:CharacterExpressionData[]=getRuntimeContent('characterExpressions',()=>([{"id":"CharacterExpression0001","enabled":true,"characterId":"Character0001","expressionCode":1,"motionManifestGraphicId":"Graphic1123","sourceGraphicId":"Graphic1128","fallbackGraphicId":"Graphic1129"}]));
