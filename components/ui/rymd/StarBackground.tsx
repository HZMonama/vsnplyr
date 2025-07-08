"use client";

import React, { useEffect, useRef } from 'react';
import './star-background-styles.css'; // Import the CSS

const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const STAR_COLOR = '#fff';
    const STAR_SIZE = 3;
    const STAR_MIN_SCALE = 0.2;
    const OVERFLOW_THRESHOLD = 50;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // STAR_COUNT needs to be calculated after window is available
    let STAR_COUNT = (window.innerWidth + window.innerHeight) / 8;


    let scale = 1; // device pixel ratio
    let width: number;
    let height: number;

    interface Star {
      x: number;
      y: number;
      z: number;
    }

    let stars: Star[] = [];

    let pointerX: number | null;
    let pointerY: number | null;

    let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.0005 };

    let touchInput = false;

    function generate() {
      stars = []; // Clear stars before generating
      STAR_COUNT = (window.innerWidth + window.innerHeight) / 8; // Recalculate on generate
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: 0,
          y: 0,
          z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE),
        });
      }
    }

    function placeStar(star: Star) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    }

    function recycleStar(star: Star) {
      let direction = 'z';

      let vx = Math.abs(velocity.x),
        vy = Math.abs(velocity.y);

      if (vx > 1 || vy > 1) {
        let axis;

        if (vx > vy) {
          axis = Math.random() < vx / (vx + vy) ? 'h' : 'v';
        } else {
          axis = Math.random() < vy / (vx + vy) ? 'v' : 'h';
        }

        if (axis === 'h') {
          direction = velocity.x > 0 ? 'l' : 'r';
        } else {
          direction = velocity.y > 0 ? 't' : 'b';
        }
      }

      star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);

      if (direction === 'z') {
        star.z = 0.1;
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      } else if (direction === 'l') {
        star.x = -OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === 'r') {
        star.x = width + OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === 't') {
        star.x = width * Math.random();
        star.y = -OVERFLOW_THRESHOLD;
      } else if (direction === 'b') {
        star.x = width * Math.random();
        star.y = height + OVERFLOW_THRESHOLD;
      }
    }

    function resize() {
      scale = window.devicePixelRatio || 1;

      width = window.innerWidth * scale;
      height = window.innerHeight * scale;

      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      
      // Regenerate stars on resize to adjust count and placement
      generate();
      stars.forEach(placeStar);
    }

    function step() {
      if (!context) return;
      context.clearRect(0, 0, width, height);

      update();
      render();

      requestAnimationFrame(step);
    }

    function update() {
      velocity.tx *= 0.96;
      velocity.ty *= 0.96;

      velocity.x += (velocity.tx - velocity.x) * 0.8;
      velocity.y += (velocity.ty - velocity.y) * 0.8;

      stars.forEach((star) => {
        star.x += velocity.x * star.z;
        star.y += velocity.y * star.z;

        star.x += (star.x - width / 2) * velocity.z * star.z;
        star.y += (star.y - height / 2) * velocity.z * star.z;
        star.z += velocity.z;

        // recycle when out of bounds
        if (
          star.x < -OVERFLOW_THRESHOLD ||
          star.x > width + OVERFLOW_THRESHOLD ||
          star.y < -OVERFLOW_THRESHOLD ||
          star.y > height + OVERFLOW_THRESHOLD
        ) {
          recycleStar(star);
        }
      });
    }

    function render() {
      if (!context) return;
      stars.forEach((star) => {
        context.beginPath();
        context.lineCap = 'round';
        context.lineWidth = STAR_SIZE * star.z * scale;
        context.globalAlpha = 0.5 + 0.5 * Math.random();
        context.strokeStyle = STAR_COLOR;

        context.beginPath();
        context.moveTo(star.x, star.y);

        var tailX = velocity.x * 2,
          tailY = velocity.y * 2;

        // stroke() wont work on an invisible line
        if (Math.abs(tailX) < 0.1) tailX = 0.5;
        if (Math.abs(tailY) < 0.1) tailY = 0.5;

        context.lineTo(star.x + tailX, star.y + tailY);

        context.stroke();
      });
    }

    function movePointer(x: number, y: number) {
      if (typeof pointerX === 'number' && typeof pointerY === 'number') {
        let ox = x - pointerX,
          oy = y - pointerY;

        // Corrected calculation to match original: (ox / 8) * scale
        velocity.tx = velocity.tx + ((ox / 8) * scale) * (touchInput ? 1 : -1);
        velocity.ty = velocity.ty + ((oy / 8) * scale) * (touchInput ? 1 : -1);
      }

      pointerX = x;
      pointerY = y;
    }

    const onMouseMove = (event: MouseEvent) => {
      touchInput = false;
      movePointer(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      touchInput = true;
      movePointer(event.touches[0].clientX, event.touches[0].clientY);
      event.preventDefault();
    };

    const onMouseLeave = () => {
      pointerX = null;
      pointerY = null;
    };
    
    // Initial setup
    generate(); // Generate stars first
    resize(); // Then resize to set canvas dimensions and place stars
    step(); // Start animation loop

    window.addEventListener('resize', resize);
    // Attach listeners directly to the canvas, as per original script's model
    if (canvas) {
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('touchmove', onTouchMove, { passive: false }); // passive: false for preventDefault
      canvas.addEventListener('touchend', onMouseLeave); // touchend was on canvas in original
    }
    document.addEventListener('mouseleave', onMouseLeave); // mouseleave was on document

    return () => {
      window.removeEventListener('resize', resize);
      if (canvas) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onMouseLeave);
      }
      document.removeEventListener('mouseleave', onMouseLeave);
      // Potentially cancel animation frame if step is stored
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return <canvas ref={canvasRef} className="star-canvas"></canvas>;
};

export default StarBackground;