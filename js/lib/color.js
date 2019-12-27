export function parseColor(str){
	str = str.trim();
	if(str.startsWith("#")){
		const hexValues = str.slice(1);
		return [parseInt(hexValues.slice(0, 2), 16), parseInt(hexValues.slice(2, 4), 16), parseInt(hexValues.slice(4, 6), 16)];
	}
	if(str.startsWith("rgb")){
		return str.match(/(?<=rgba?\()(.*)(?=\))/)[0].split(",").map(x => parseInt(x.trim()));
	}
}