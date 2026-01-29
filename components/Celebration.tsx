import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
}

interface CelebrationProps {
  visible: boolean;
  onComplete?: () => void;
}

const COLORS = ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];

export default function Celebration({ visible, onComplete }: CelebrationProps) {
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Initialize particles
  useEffect(() => {
    particles.current = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset and animate particles
      const animations = particles.current.map((particle) => {
        // Random starting position near center
        const startX = (Math.random() - 0.5) * 100;
        const startY = (Math.random() - 0.5) * 50;
        
        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 300;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 200; // Upward bias
        
        // Random rotation
        const rotation = Math.random() * 720 - 360;
        
        // Reset values
        particle.x.setValue(startX);
        particle.y.setValue(startY);
        particle.rotate.setValue(0);
        particle.scale.setValue(0);
        particle.opacity.setValue(1);

        return Animated.parallel([
          // Move outward
          Animated.timing(particle.x, {
            toValue: endX,
            duration: 1500 + Math.random() * 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: endY,
            duration: 1500 + Math.random() * 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Rotate
          Animated.timing(particle.rotate, {
            toValue: rotation,
            duration: 1500 + Math.random() * 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Scale up then down
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 0.5 + Math.random() * 0.5,
              duration: 200,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1300 + Math.random() * 500,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          // Fade out
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1500,
            delay: 500,
            useNativeDriver: true,
          }),
        ]);
      });

      animationRef.current = Animated.stagger(20, animations);
      animationRef.current.start(() => {
        onComplete?.();
      });
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { rotate: particle.rotate.interpolate({
                  inputRange: [-360, 360],
                  outputRange: ["-360deg", "360deg"],
                }) },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
