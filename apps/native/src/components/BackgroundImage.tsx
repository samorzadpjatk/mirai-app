import { Image } from "tamagui";

const BackgroundImage = () => {
  return (
    <Image
      source={{ uri: "/background.jpg" }}
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      width="100%"
      height="100%"
      resizeMode="cover"
      z={-1}
      style={{
        mixBlendMode: 'multiply',
      }}
    />
  );
};
export default BackgroundImage;