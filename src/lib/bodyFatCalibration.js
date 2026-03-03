// --- Body Fat Calibration ---

export function recalcCalibration(cal) {
 if (!cal.points || cal.points.length === 0) return cal;
 const pts = cal.points;
 // Simple offset: average of (dexa - bia)
 const offsets = pts.map(p => p.dexaValue - p.biaValue);
 const avgOffset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
 const updated = { ...cal, offset: Math.round(avgOffset * 100) / 100 };

 // Linear regression (2+ points)
 if (pts.length >= 2) {
 const n = pts.length;
 const sumX = pts.reduce((a, p) => a + p.biaValue, 0);
 const sumY = pts.reduce((a, p) => a + p.dexaValue, 0);
 const sumXY = pts.reduce((a, p) => a + p.biaValue * p.dexaValue, 0);
 const sumX2 = pts.reduce((a, p) => a + p.biaValue * p.biaValue, 0);
 const denom = n * sumX2 - sumX * sumX;
 if (denom !== 0) {
 const slope = (n * sumXY - sumX * sumY) / denom;
 const intercept = (sumY - slope * sumX) / n;
 // R² calculation
 const meanY = sumY / n;
 const ssRes = pts.reduce((a, p) => a + (p.dexaValue - (intercept + slope * p.biaValue)) ** 2, 0);
 const ssTot = pts.reduce((a, p) => a + (p.dexaValue - meanY) ** 2, 0);
 updated.slope = Math.round(slope * 1000) / 1000;
 updated.intercept = Math.round(intercept * 100) / 100;
 updated.rSquared = ssTot > 0 ? Math.round((1 - ssRes / ssTot) * 1000) / 1000 : null;
 }
 }

 // EWMA offset (2+ points)
 if (pts.length >= 2) {
 const alpha = cal.ewmaAlpha || 0.6;
 let ewma = offsets[0];
 for (let i = 1; i < offsets.length; i++) {
 ewma = alpha * offsets[i] + (1 - alpha) * ewma;
 }
 updated.ewmaOffset = Math.round(ewma * 100) / 100;
 }

 // Bayesian (prior + data)
 const prior = cal.prior || { mean: 3.0, precision: 0.5 };
 const dataMean = avgOffset;
 const dataPrecision = pts.length * 0.8; // each point adds ~0.8 precision
 const postPrecision = prior.precision + dataPrecision;
 const postMean = (prior.precision * prior.mean + dataPrecision * dataMean) / postPrecision;
 updated.posterior = {
 mean: Math.round(postMean * 100) / 100,
 precision: Math.round(postPrecision * 100) / 100,
 };

 updated.lastCalibrationDate = pts.length > 0 ? pts[pts.length - 1].date : null;
 return updated;
}

export function getCalibratedBodyFat(rawBIA, cal) {
 if (!cal || !cal.points || cal.points.length === 0) {
 return { value: rawBIA, calibrated: false, confidence: 'uncalibrated' };
 }
 const raw = Number(rawBIA);
 switch (cal.method) {
 case 'linear_regression':
 if (cal.points.length >= 2 && cal.slope != null) {
 return {
 value: Math.round((cal.intercept + cal.slope * raw) * 10) / 10,
 calibrated: true,
 confidence: cal.rSquared > 0.9 ? 'high' : 'medium',
 };
 }
 return { value: Math.round((raw + cal.offset) * 10) / 10, calibrated: true, confidence: 'low' };
 case 'rolling_weighted':
 if (cal.points.length >= 2 && cal.ewmaOffset != null) {
 return {
 value: Math.round((raw + cal.ewmaOffset) * 10) / 10,
 calibrated: true,
 confidence: cal.points.length >= 3 ? 'high' : 'medium',
 };
 }
 return { value: Math.round((raw + cal.offset) * 10) / 10, calibrated: true, confidence: 'low' };
 case 'bayesian':
 if (cal.posterior?.mean != null) {
 return {
 value: Math.round((raw + cal.posterior.mean) * 10) / 10,
 calibrated: true,
 confidence: cal.posterior.precision > 2 ? 'high' : 'medium',
 };
 }
 return { value: Math.round((raw + cal.offset) * 10) / 10, calibrated: true, confidence: 'low' };
 default: // simple_offset
 return {
 value: Math.round((raw + cal.offset) * 10) / 10,
 calibrated: true,
 confidence: cal.points.length === 1 ? 'low' : 'medium',
 };
 }
}
