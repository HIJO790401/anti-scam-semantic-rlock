import { ExtractedFeatures, GovernanceResult } from "@/lib/void-engine/types";

export function detectVoidGovernance(message: string, f: ExtractedFeatures): GovernanceResult {
  const codes: string[] = [];

  const fakeProReferral = /(請諮詢專業人士|詢問專家|請洽顧問|請洽專業人士|洽專業人士處理)/i.test(message) && !f.hasSubjectIdentity;
  const delayEscape = /(我們會改善|我們會修正|將持續優化|會持續優化|後續再處理)/i.test(message) && !/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|負責人|owner|承辦)/i.test(message);
  const fakeNeutrality = /(很多人都這樣認為|全球都在討論|普遍認為|大家都還在討論|可能只是巧合)/i.test(message) && (!f.hasSubjectIdentity || !f.hasBoundarySignal || !f.hasResponsibilitySignal);
  const responsibilityEscape = /(我們只是機率式系統|僅供參考不負責|模型可能出錯不承擔|仍需要更多研究驗證)/i.test(message);
  const comparisonVoid = /(比其他系統更安全|比別家好|業界最佳)/i.test(message) && !/(測試範圍|評估方法|責任範圍)/i.test(message);
  const frameworkScopeViolation = /(法規會處理|制度會保護你|交給政府)/i.test(message) && !/(哪個法規|哪個機關|受理窗口|責任歸屬)/i.test(message);
  const causalOnlyStructureVoid =
    /(只有說|只說).*(因果|cause)/i.test(message) &&
    /(邊界模糊|邊界不清|boundary.*模糊)/i.test(message) &&
    /((成本|代價).*(依據|基礎)|(依據|基礎).*(成本|代價)).*(不平衡|失衡)/i.test(message) &&
    /(沒有誰承擔|無人承擔|沒有.*負責|直接VOID|void)/i.test(message);

  if (fakeProReferral) codes.push("fakeProReferral");
  if (delayEscape) codes.push("delayEscape");
  if (fakeNeutrality) codes.push("fakeNeutrality");
  if (responsibilityEscape) codes.push("responsibilityEscape");
  if (comparisonVoid) codes.push("comparisonVoid");
  if (frameworkScopeViolation) codes.push("frameworkScopeViolation");
  if (causalOnlyStructureVoid) codes.push("causalOnlyStructureVoid");

  return {
    isVoidGovernance: codes.length > 0,
    codes
  };
}
