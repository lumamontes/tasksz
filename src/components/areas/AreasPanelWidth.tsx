import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { $areasPanelWidth } from '../../stores/layoutStore';

export function AreasPanelWidth() {
  const width = useStore($areasPanelWidth);

  useEffect(() => {
    document.querySelector<HTMLElement>('[data-areas-shell]')?.style.setProperty('--areas-panel-width', `${width}px`);
  }, [width]);

  return null;
}
