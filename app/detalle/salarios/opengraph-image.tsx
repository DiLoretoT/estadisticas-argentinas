import { renderDetalleOg, ogAlt, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/ogDetalle";

export const alt = ogAlt("salarios");
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderDetalleOg("salarios");
}
