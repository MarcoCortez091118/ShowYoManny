import { Warp } from "@paper-design/shaders-react"
import { CSSProperties } from "react"

interface WrapShaderProps {
  color1?: string;
  color2?: string;
  speed?: number;
  style?: CSSProperties;
}

export function WrapShader({ color1 = "#f10a94", color2 = "#00d4ff", speed = 1.5, style }: WrapShaderProps) {
  return (
    <Warp
      style={style}
      proportion={0.45}
      softness={1}
      distortion={0.25}
      swirl={0.8}
      swirlIterations={5}
      shape="checks"
      shapeScale={0.1}
      scale={1}
      rotation={0}
      speed={speed}
      colors={[color1, color2, "hsl(180, 90%, 30%)", "hsl(170, 100%, 80%)"]}
    />
  )
}

export default function WarpShaderHero() {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-cyan-900 via-teal-800 to-cyan-900">
      <WrapShader
        style={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0
        }}
      />
    </div>
  )
}
