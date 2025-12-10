import Image from "next/image";

const BackgroundImage = () => {
  return (
    <Image
      src="/background.jpg"
      alt="Background"
      width="5504"
      height="4625"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        mixBlendMode: 'multiply',
        zIndex: -1,
      }}
    />
  );
};
export default BackgroundImage;