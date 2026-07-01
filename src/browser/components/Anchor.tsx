import { MouseEvent, ReactNode, AnchorHTMLAttributes } from "react";
import tw, { styled } from "twin.macro";

import { openUrl } from "~/common/helpers";

const Wrapper = styled.a`
  ${tw`block cursor-pointer no-underline text-inherit`}
`;

export interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children?: ReactNode;
  className?: string;
}

function Anchor({ to, children, className, ...rest }: AnchorProps) {
  return (
    <Wrapper
      href={to}
      className={className}
      onClick={(event: MouseEvent) => openUrl(to, event)}
      onAuxClick={(event: MouseEvent) => openUrl(to, event)}
      {...rest}
    >
      {children}
    </Wrapper>
  );
}

export default Anchor;
