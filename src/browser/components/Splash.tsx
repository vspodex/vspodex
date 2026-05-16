import { ReactNode } from "react";
import tw, { styled } from "twin.macro";

const Wrapper = styled.div`
  ${tw`flex flex-1 items-center justify-center p-8 text-neutral-500 text-center text-sm`}
`;

interface SplashProps {
  children: ReactNode;
}

function Splash(props: SplashProps) {
  return <Wrapper>{props.children}</Wrapper>;
}

export default Splash;
