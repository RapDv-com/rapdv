// Copyright (C) Konrad Gadzinowski

import { html } from "./Html";

type Props = {
  children?: any
}

export const ImportMap = ({ children }: Props) => {
  return html`
    <script type="importmap"
      dangerouslySetInnerHTML=${{ __html: children }}
    >
    </script>
  `;
};