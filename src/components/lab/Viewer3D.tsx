import { Canvas, useThree } from "@react-three/fiber";
import { GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  NoToneMapping,
  Uint16BufferAttribute,
} from "three";
import { BASE_MESH, paintVertexColors } from "@/lib/deco/colormap";
import { useLab } from "@/lib/deco/store";
import type { CameraPreset, RenderMode, SmplMesh } from "@/lib/deco/types";
import { SMPL_VERTEX_COUNT } from "@/lib/deco/types";

const DIST = 5.05;
const PRESETS: Record<CameraPreset, [number, number, number]> = {
  front: [0, -0.22, DIST],
  back: [0, -0.22, -DIST],
  left: [-DIST, -0.22, 0],
  right: [DIST, -0.22, 0],
  top: [0, DIST - 0.15, 0.08],
  bottom: [0, -DIST - 0.15, 0.08],
  reset: [0, -0.22, DIST],
};

const TARGET = { x: 0, y: -0.3, z: 0 } as const;
const NEUTRAL_PROB = new Float32Array(SMPL_VERTEX_COUNT);
const STAGE = "#0c1013";

function buildBodyGeometry(mesh: SmplMesh): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(mesh.vertices.slice(), 3));
  const index = new Uint16Array(mesh.faces.length);
  index.set(mesh.faces);
  g.setIndex(new Uint16BufferAttribute(index, 1));
  const colors = new Float32Array(mesh.vertexCount * 3);
  for (let i = 0; i < mesh.vertexCount; i++) {
    colors[i * 3] = BASE_MESH[0];
    colors[i * 3 + 1] = BASE_MESH[1];
    colors[i * 3 + 2] = BASE_MESH[2];
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function CameraRig({ preset, nonce }: { preset: CameraPreset; nonce: number }) {
  const { camera, controls } = useThree();
  useLayoutEffect(() => {
    const pos = PRESETS[preset] ?? PRESETS.front;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(TARGET.x, TARGET.y, TARGET.z);
    camera.updateProjectionMatrix();
    const ctrl = controls as { target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    if (ctrl?.target) {
      ctrl.target.set(TARGET.x, TARGET.y, TARGET.z);
      ctrl.update();
    }
  }, [preset, nonce, camera, controls]);
  return null;
}

function ContactMesh({
  mesh,
  probability,
  threshold,
  renderMode,
}: {
  mesh: SmplMesh;
  probability: Float32Array;
  threshold: number;
  renderMode: RenderMode;
}) {
  const geometry = useMemo(() => buildBodyGeometry(mesh), [mesh]);

  const colorMode =
    renderMode === "probability" ? "probability" : renderMode === "neutral" ? "neutral" : "binary";

  useLayoutEffect(() => {
    const attr = geometry.getAttribute("color") as BufferAttribute;
    paintVertexColors(attr.array as Float32Array, probability, colorMode, threshold);
    attr.needsUpdate = true;
  }, [geometry, probability, threshold, colorMode]);

  const showPoints = renderMode === "points";
  const showCombinedWire = renderMode === "combined";
  const wireframe = renderMode === "wireframe";

  return (
    <group>
      {!showPoints ? (
        <mesh geometry={geometry} frustumCulled={false} dispose={null}>
          <meshLambertMaterial
            vertexColors
            side={DoubleSide}
            wireframe={wireframe}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ) : (
        <points geometry={geometry} frustumCulled={false} dispose={null}>
          <pointsMaterial vertexColors size={0.022} sizeAttenuation />
        </points>
      )}
      {showCombinedWire ? (
        <lineSegments>
          <wireframeGeometry args={[geometry]} />
          <lineBasicMaterial color="#6ec4a8" transparent opacity={0.32} />
        </lineSegments>
      ) : null}
    </group>
  );
}

export function Viewer3D({ mesh }: { mesh: SmplMesh | null }) {
  const result = useLab((s) => s.result);
  const threshold = useLab((s) => s.threshold);
  const renderMode = useLab((s) => s.renderMode);
  const autoRotate = useLab((s) => s.autoRotate);
  const cameraPreset = useLab((s) => s.cameraPreset);
  const cameraNonce = useLab((s) => s.cameraNonce);

  return (
    <div className="absolute inset-0 bg-inset">
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: false,
          toneMapping: NoToneMapping,
        }}
        camera={{ position: [0, -0.22, DIST], fov: 42, near: 0.05, far: 60 }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new Color(STAGE), 1);
          scene.background = new Color(STAGE);
          (window as unknown as { __decoGl?: { domElement: HTMLCanvasElement } }).__decoGl = {
            domElement: gl.domElement,
          };
        }}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
      >
        <color attach="background" args={[STAGE]} />
        <hemisphereLight args={["#f4f7f5", "#3a4542", 1.55]} />
        <directionalLight position={[2.6, 3.8, 5.2]} intensity={2.4} />
        <directionalLight position={[-3.2, 1.6, 2.2]} intensity={1.15} />
        <directionalLight position={[0.4, 2.0, -4.0]} intensity={0.55} color="#b7d4c8" />
        <ambientLight intensity={0.7} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.172, 0]}>
          <circleGeometry args={[2.15, 64]} />
          <meshLambertMaterial color="#1a2224" />
        </mesh>
        <gridHelper args={[4.2, 21, "#334440", "#1e2826"]} position={[0, -1.17, 0]} />

        {mesh ? (
          <ContactMesh
            mesh={mesh}
            probability={result?.contactProbability ?? NEUTRAL_PROB}
            threshold={threshold}
            renderMode={result ? renderMode : "neutral"}
          />
        ) : null}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
          target={[0, -0.3, 0]}
          minDistance={1.6}
          maxDistance={12}
          maxPolarAngle={Math.PI * 0.95}
        />
        <CameraRig preset={cameraPreset} nonce={cameraNonce} />
        <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
          <GizmoViewport axisColors={["#c07070", "#6ec4a8", "#7aa0c4"]} labelColor="#e8eeea" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}

export function captureViewerPng(): Promise<Blob | null> {
  const gl = (window as unknown as { __decoGl?: { domElement: HTMLCanvasElement } }).__decoGl;
  if (!gl) return Promise.resolve(null);
  return new Promise((resolve) => {
    gl.domElement.toBlob((b) => resolve(b), "image/png");
  });
}
