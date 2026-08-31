import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const createNodes = (count, width, height) => Array.from({ length: count }, (_, index) => {
  const clustered = index % 4 === 0;
  return {
  x: clustered ? width * .5 + (Math.random() - .5) * Math.min(width * .56, 760) : ((index * 73) % width) + Math.random() * 48,
  y: clustered ? height * .5 + (Math.random() - .5) * Math.min(height * .66, 570) : ((index * 131) % height) + Math.random() * 34,
  vx: (Math.random() - 0.5) * 0.12,
  vy: (Math.random() - 0.5) * 0.12,
  radius: index % 11 === 0 ? 4.2 + Math.random() * 3.8 : 1 + Math.random() * 2.55,
  tone: index % 4,
};
});

export default function LandingNetworkBackdrop() {
  const canvasRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const networkY = useTransform(scrollY, [0, 2200], [0, -18]);
  const orbY = useTransform(scrollY, [0, 2200], [0, -72]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const staticMotion = motionQuery.matches;
    let nodes = [];
    let width = 0;
    let height = 0;
    let frameId;
    let visible = !document.hidden;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      nodes = createNodes(width < 700 ? 42 : 98, width, height);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const maxDistance = width < 700 ? 122 : 194;
      nodes.forEach((node) => {
        if (!staticMotion && visible) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -20 || node.x > width + 20) node.vx *= -1;
          if (node.y < -20 || node.y > height + 20) node.vy *= -1;
        }
      });
      for (let first = 0; first < nodes.length; first += 1) {
        for (let second = first + 1; second < nodes.length; second += 1) {
          const a = nodes[first]; const b = nodes[second];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > maxDistance) continue;
          context.strokeStyle = `rgba(123, 210, 218, ${(1 - distance / maxDistance) * 0.22})`;
          context.lineWidth = 0.72;
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
        }
      }
      const colors = ["#33d5e6", "#74c7cc", "#8c6fd1", "#ce7742"];
      nodes.forEach((node) => {
        context.fillStyle = colors[node.tone]; context.globalAlpha = node.radius > 4 ? 0.52 : 0.42;
        context.beginPath(); context.arc(node.x, node.y, node.radius, 0, Math.PI * 2); context.fill();
      });
      context.globalAlpha = 1;
      if (!staticMotion && visible) frameId = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !staticMotion) { window.cancelAnimationFrame(frameId); frameId = window.requestAnimationFrame(draw); }
    };
    resize(); draw();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.cancelAnimationFrame(frameId); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  return <motion.div className="landing-network" aria-hidden="true" initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3, ease: [0.22, 1, .36, 1] }}><div className="landing-network__atmosphere" /><motion.canvas ref={canvasRef} className="landing-network__canvas" style={reduceMotion ? undefined : { y: networkY }} /><motion.div className="landing-network__orb" style={reduceMotion ? undefined : { y: orbY }}><i /><i /><i /><b /></motion.div><motion.div className="landing-network__grid" style={reduceMotion ? undefined : { y: networkY }} /></motion.div>;
}
