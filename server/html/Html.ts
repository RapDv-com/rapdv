import { h, VNode } from "preact";
import htm from "htm";

export const html = htm.bind(h) as (
  strings: TemplateStringsArray,
  ...values: any[]
) => VNode