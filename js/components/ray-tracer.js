import {
	VEC_UP,
	subtractVector,
	addVector,
	dotVector,
	crossVector,
	scaleVector,
	normalizeVector,
	reflectVector,
	parseVector
} from "../lib/vector.js";
import { parseColor } from "../lib/color.js";

customElements.define("ray-tracer",
	class extends HTMLElement {
		static get observedAttributes(){
			return [
				"width",
				"height"
			];
		}
		constructor(){
			super();
			this.bind(this);
		}
		bind(element){
			element.getComponents = element.getComponents.bind(element);
			element.setupDom = element.setupDom.bind(element);
			element.cacheDom = element.cacheDom.bind(element);
			element.render = element.render.bind(element);
		}
		setupDom(){
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<canvas height="${this.height}" width=${this.width}></canvas>
			`;
		}
		getComponents(){
			this.scene = {
				lights: [],
				objects: []
			};
			Array.from(this.childNodes)
				.filter(c => c.nodeType === 1)
				.forEach(c => {
					switch(c.tagName.toLowerCase()){
						case "ray-tracer-camera":
							this.camera = {
								location: parseVector(c.getAttribute("location")),
								fieldOfView: parseFloat(c.getAttribute("field-of-view")) || 45,
								direction: parseVector(c.getAttribute("direction")) 
							};
							break;
						case "ray-tracer-light":
							this.scene.lights.push(parseVector(c.getAttribute("location")));
							break;
						case "ray-tracer-sphere":
							this.scene.objects.push({
								location: parseVector(c.getAttribute("location")),
								color: parseColor(c.getAttribute("color")),
								radius: parseFloat(c.getAttribute("radius")),
								lambert: parseFloat(c.getAttribute("lambert")),
								specular: parseFloat(c.getAttribute("specular")),
								ambient: parseFloat(c.getAttribute("ambient"))
							});
							break;
					}
				});
		}
		connectedCallback(){
			this.width = this.width || 1280;
			this.height = this.height || 720;

			this.getComponents();
			this.setupDom();
			this.cacheDom();

			this.context = this.dom.canvas.getContext("2d");

			this.render();
		}
		cacheDom(){
			this.dom = {
				canvas: this.shadowRoot.querySelector("canvas")
			};
		}
		render(){
			const eyeVector = normalizeVector(subtractVector(this.camera.direction, this.camera.location));
			const viewRight = normalizeVector(crossVector(eyeVector, VEC_UP));
			const viewUp = normalizeVector(crossVector(viewRight, eyeVector));

			const fovRadians = Math.PI * (this.camera.fieldOfView / 2) / 180;
			const aspectRatio = this.height / this.width;
			const halfWidth = Math.tan(fovRadians);
			const halfHeight = aspectRatio * halfWidth;
			const cameraWidth = halfWidth * 2;
			const cameraHeight = halfHeight * 2;
			const pixelWidth = cameraWidth / (this.width - 1);
			const pixelHeight = cameraHeight / (this.height - 1);

			const pixelData = this.context.getImageData(0, 0, this.width, this.height);

			for (let row = 0; row < this.height; row++) {
				for (let col = 0; col < this.width; col++) {
					const xComp = scaleVector(viewRight, (col * pixelWidth) - halfWidth);
					const yComp = scaleVector(viewUp, (row * pixelHeight) - halfHeight);

					const ray = {
						origin: this.camera.location,
						direction: normalizeVector(addVector(addVector(eyeVector, xComp), yComp))
					};
					const color = trace(ray, this.scene, 0)

					const index = (row * 4) + (col * this.width * 4);
					pixelData.data[index + 0] = color[0];
					pixelData.data[index + 1] = color[1];
					pixelData.data[index + 2] = color[2];
					pixelData.data[index + 3] = 255;
				}
			}

			this.context.putImageData(pixelData, 0, 0);
		}
		attributeChangedCallback(name, oldValue, newValue){
			this[name] = newValue;
		}
	}
);

function trace(ray, scene, depth){
	if(depth > 3) return;

	const intersection = intersectObjects(ray, scene.objects);

	if(intersection.distance === Infinity){
		return [255,255,255];
	}

	const intersectionPoint = addVector(ray.origin, scaleVector(ray.direction, intersection.distance));

	return surface(ray, scene, intersection.object, intersectionPoint, depth);
}

function intersectObjects(ray, objects){
	let closest = { distance: Infinity, object: null };
	for(let obj of objects){
		const distance = sphereIntersection(ray, obj);
		if(distance != undefined && distance < closest.distance){
			closest = { distance, object: obj };
		}
	}
	return closest;
}

function sphereIntersection(ray, sphere){
	const eyeToCenter = subtractVector(sphere.location, ray.origin);
	const v = dotVector(eyeToCenter, ray.direction);
	const eyeToCenterDistance = dotVector(eyeToCenter, eyeToCenter);
	const discriminant = sphere.radius ** 2 - eyeToCenterDistance + v**2
	if(discriminant < 0){
		return undefined;
	} else{
		return v - Math.sqrt(discriminant);
	}
}

function sphereNormal(sphere, position){
	return normalizeVector(subtractVector(position, sphere.location));
}

function surface(ray, scene, obj, intersectionPoint, depth){
	let lambertAmount = 0;
	let color = [0,0,0];

	const normal = sphereNormal(obj, intersectionPoint);
	if(obj.lambert){
		for(let light of scene.lights){
			if(!isLightVisible(intersectionPoint, scene.objects, light)) continue;

			const contribution = dotVector(normalizeVector(subtractVector(light, intersectionPoint)), normal);
			if(contribution > 0){
				lambertAmount += contribution;
			}
		}
	}
	if(obj.specular){
		const reflectedRay = { origin: intersectionPoint, direction: reflectVector(ray.direction, normal) };
		const reflectedColor = trace(reflectedRay, scene, depth + 1);
		if(reflectedColor){
			color = addVector(color, scaleVector(reflectedColor, obj.specular));
		}
	}
	lambertAmount = Math.min(1, lambertAmount);

	return addVector(color, addVector(scaleVector(obj.color, lambertAmount * obj.lambert), scaleVector(obj.color, obj.ambient)));
}

function isLightVisible(point, objects, light){
	const intersection = intersectObjects({ origin: point, direction: normalizeVector(subtractVector(point, light)) }, objects);
	return intersection.distance > -0.005;
}
