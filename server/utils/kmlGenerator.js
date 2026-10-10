/**
 * Keyhole Markup Language (KML) Generator for Google Earth / GIS Integration
 * Conforms to Open Geospatial Consortium (OGC) KML 2.2 Standard
 */

function generateKML({ documentName, address, coordinates, description }) {
  // Ensure coordinates loop back to the first point to close the polygon ring
  const points = [...coordinates];
  if (points.length > 0) {
    const first = points[0];
    const last = points[points.length - 1];
    if (first.lat !== last.lat || first.lng !== last.lng) {
      points.push(first);
    }
  }

  // KML coordinates format: longitude,latitude,altitude (space-separated)
  const coordString = points
    .map(pt => `${pt.lng},${pt.lat},0`)
    .join(' ');

  const escapedDocName = (documentName || 'SEG Protected Area').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedAddress = (address || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedDesc = (description || `Geolocked document zone for ${escapedDocName}`).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapedDocName} - Access Boundary</name>
    <description>${escapedDesc} at ${escapedAddress}</description>
    <Style id="segPolygonStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>4d0000ff</color>
        <fill>1</fill>
        <outline>1</outline>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${escapedDocName} Zone</name>
      <description>Physical authorization boundary. Receiver must be within this perimeter to decrypt.</description>
      <styleUrl>#segPolygonStyle</styleUrl>
      <Polygon>
        <extrude>1</extrude>
        <altitudeMode>clampToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coordString}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
}

module.exports = {
  generateKML
};
