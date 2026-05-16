import { MouseEvent, ReactNode } from "react";
import tw, { styled } from "twin.macro";

import { openUrl } from "~/common/helpers";

const Wrapper = styled.a`
  ${tw`block cursor-pointer no-underline text-inherit`}
`;

export interface AnchorProps {
  to: string;
  children?: ReactNode;
  className?: string;
}

function Anchor(props: AnchorProps) {
  return (
    <Wrapper
      href={props.to}
      className={props.className}
      onClick={(event: MouseEvent) => openUrl(props.to, event)}
      onAuxClick={(event: MouseEvent) => openUrl(props.to, event)}
    >
      {props.children}
    </Wrapper>
  );
}

export default Anchor;
