import { Image } from "tamagui";

const BackgroundImage = () => {
  return (
    <Image
      source={{ uri: "/background.jpg" }}
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      width="100%"
      height="100%"
      resizeMode="cover"
      zIndex={-1}
      style={{
        mixBlendMode: 'multiply',
      }}
    />
  );
};
export default BackgroundImage;