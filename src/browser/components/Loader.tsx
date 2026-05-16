import { ReactNode, Suspense } from "react";
import tw, { styled } from "twin.macro";

const Wrapper = styled.div`
  ${tw`flex items-center justify-center h-full w-full`}
`;

const SpinnerRing = styled.div`
  ${tw`animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500`}
`;

function Fallback() {
  return (
    <Wrapper>
      <SpinnerRing />
    </Wrapper>
  );
}

interface LoaderProps {
  children: ReactNode;
}

function Loader(props: LoaderProps) {
  return <Suspense fallback={<Fallback />}>{props.children}</Suspense>;
}

export default Loader;
