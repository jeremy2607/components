import type * as L from 'leaflet';

/**
 * La molette ne zoome qu'une fois la carte engagée.
 *
 * Une carte posée au milieu d'une page qui défile ne doit pas avaler la
 * molette au passage du curseur : on cherchait à lire la suite, on se retrouve
 * en orbite. Elle prend la molette après un clic ou une prise de focus, et la
 * rend dès que le curseur sort. Les boutons de zoom, eux, marchent toujours.
 */
export function guardWheelZoom(map: L.Map): void {
  const enable = () => {
    map.scrollWheelZoom.enable();
  };
  const disable = () => {
    map.scrollWheelZoom.disable();
  };

  disable();
  map.on('click', enable);
  map.on('focus', enable);
  map.on('mouseout', disable);
  map.on('blur', disable);
}
