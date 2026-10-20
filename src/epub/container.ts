import { XML_DECL } from './xml'

/** META-INF/container.xml — menunjuk ke OEBPS/content.opf (statis). */
export const CONTAINER_XML = [
  XML_DECL,
  '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">',
  '  <rootfiles>',
  '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>',
  '  </rootfiles>',
  '</container>',
  '',
].join('\n')
