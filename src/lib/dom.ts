/**
 * Utilidades para pintar en el navegador el contenido que llega de la API.
 *
 * Cada sección tiene bloques `[data-view="loading|ready|empty|error"]` y
 * plantillas `<template>` con el marcado; aquí se alterna el bloque visible
 * y se rellenan los campos `[data-field]` de cada copia.
 */
import type { ImageSource } from "@/lib/wordpress";

/** Muestra solo el bloque `[data-view]` hijo directo que coincide con `view`. */
export function showView(root: HTMLElement, view: string): void {
  root.querySelectorAll<HTMLElement>(":scope > [data-view]").forEach((block) => {
    block.hidden = block.dataset.view !== view;
  });
  root.setAttribute("aria-busy", String(view === "loading"));
}

/** Clona el primer elemento de una plantilla `<template>`. */
export function cloneTemplate<T extends HTMLElement = HTMLElement>(
  template: HTMLTemplateElement | null,
): T {
  const element = template?.content.firstElementChild?.cloneNode(true);
  if (!(element instanceof HTMLElement)) {
    throw new Error("Plantilla no encontrada");
  }
  return element as T;
}

/** Busca el elemento `[data-field="name"]` dentro de `root`. */
export function getField<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  name: string,
): T | null {
  return root.querySelector<T>(`[data-field="${name}"]`);
}

/** Asigna texto plano a un campo (nunca HTML). */
export function setField(root: ParentNode, name: string, text: string): void {
  const element = getField(root, name);
  if (element) element.textContent = text;
}

/** Elimina un campo opcional que no tiene contenido. */
export function removeField(root: ParentNode, name: string): void {
  getField(root, name)?.remove();
}

/** Carga una imagen responsiva en un `<img>`. */
export function applyImage(
  img: HTMLImageElement,
  image: ImageSource,
  alt: string,
  sizes: string,
): void {
  if (image.srcset) {
    img.sizes = sizes;
    img.srcset = image.srcset;
  }
  if (image.width && image.height) {
    img.width = image.width;
    img.height = image.height;
  }
  img.alt = alt;
  img.src = image.src;
}
