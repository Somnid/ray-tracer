export const VEC_UP = Object.freeze([0, 1, 0]);
export const VEC_ZERO = Object.freeze([0, 0, 0]);

export function subtractVector(a, b) {
	return [
		a[0] - b[0],
		a[1] - b[1],
		a[2] - b[2]
	];
}

export function addVector(a, b) {
	return [
		a[0] + b[0],
		a[1] + b[1],
		a[2] + b[2]
	];
}

export function dotVector(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossVector(a, b) {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	];
}

export function scaleVector(vec, s) {
	return [
		vec[0] * s,
		vec[1] * s,
		vec[2] * s
	];
}

export function magnitudifyVector(vec) {
	return Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
}

export function normalizeVector(vec) {
	return scaleVector(vec, 1 / magnitudifyVector(vec));
}

export function reflectVector(vec, normal) {
	const d = scaleVector(normal, dotVector(vec, normal));
	return subtractVector(scaleVector(d, 2), vec);
}

export function parseVector(str){
	return str.split(",").map(x => parseFloat(x.trim()));
}