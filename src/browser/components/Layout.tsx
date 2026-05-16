import { ReactNode } from "react";
import tw, { styled } from "twin.macro";

const Wrapper = styled.div`
  ${tw`flex flex-col h-full`}
`;

const Content = styled.div`
  ${tw`flex-1 overflow-auto`}
`;

interface LayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
}

function Layout(props: LayoutProps) {
  return (
    <Wrapper>
      <Content>{props.children}</Content>
    </Wrapper>
  );
}

export default Layout;
