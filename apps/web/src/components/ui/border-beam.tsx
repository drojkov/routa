"use client";

/**
 * Обёртка над npm-пакетом `border-beam` (автор оригинала на 21st.dev — Jakub Antalik).
 * Экспортирует API из промпта borderbeam.txt: default `BeamBorder` + `BeamBorderProps`,
 * и добавляет проп `beamWidth`, которого нет в пакете (толщина луча в px).
 */
import { BorderBeam, type BorderBeamProps } from "border-beam";
import * as React from "react";

export type BeamBorderProps = BorderBeamProps & {
  /** Толщина луча по краю, px. По умолчанию 1 (как в пакете). */
  beamWidth?: number;
};

const BeamBorder = React.forwardRef<HTMLDivElement, BeamBorderProps>(
  ({ beamWidth, css, ...props }, ref) => {
    const widthCss =
      beamWidth && beamWidth !== 1
        ? `[data-beam="{id}"]::after{padding:${beamWidth}px !important;}`
        : "";
    return <BorderBeam ref={ref} css={`${widthCss}${css ?? ""}`} {...props} />;
  },
);
BeamBorder.displayName = "BeamBorder";

export { BeamBorder };
export default BeamBorder;
