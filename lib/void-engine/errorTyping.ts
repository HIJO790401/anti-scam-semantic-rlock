import { ErrorLayer, ErrorType, ErrorTypingResult } from "@/lib/void-engine/types";

export function classifyErrorTyping(message: string): ErrorTypingResult {
  const error_type = new Set<ErrorType>();
  const error_layer = new Set<ErrorLayer>();

  if (/(場景|情境|流程錯誤)/i.test(message)) {
    error_type.add("SCENE_ERROR");
    error_layer.add("SCENE_LAYER");
  }
  if (/(演算法|模型|權重|參數)/i.test(message)) {
    error_type.add("ALGORITHM_ERROR");
    error_layer.add("ALGORITHM_LAYER");
  }
  if (/(責任|負責|承擔|問責)/i.test(message)) {
    error_type.add("RESPONSIBILITY_ERROR");
    error_layer.add("RESPONSIBILITY_LAYER");
  }
  if (/(定義|口徑|標準)/i.test(message)) {
    error_type.add("DEFINITION_ERROR");
    error_layer.add("DEFINITION_LAYER");
  }
  if (/(成本|損失|代價|風險)/i.test(message)) {
    error_type.add("COST_ERROR");
    error_layer.add("RULE_LAYER");
  }
  if (/(邊界|範圍|時限|限制)/i.test(message)) {
    error_type.add("BOUNDARY_ERROR");
    error_layer.add("CLAIM_LAYER");
  }
  if (/(驗證|校驗|validate|格式)/i.test(message)) {
    error_type.add("VALIDATION_ERROR");
    error_layer.add("VALIDATOR_LAYER");
  }
  if (/(owner|負責人|承辦人)/i.test(message)) {
    error_type.add("OWNER_ERROR");
    error_layer.add("OUTPUT_LAYER");
  }
  if (/(比較|對照|benchmark)/i.test(message)) {
    error_type.add("COMPARISON_ERROR");
    error_layer.add("OUTPUT_LAYER");
  }

  if (error_type.size === 0) error_type.add("UNKNOWN_ERROR");
  if (error_layer.size === 0) error_layer.add("INPUT_LAYER");

  return {
    error_type: [...error_type],
    error_layer: [...error_layer]
  };
}
