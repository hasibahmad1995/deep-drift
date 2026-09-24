const {NodeIO}=require('@gltf-transform/core');const sharp=require('sharp');
(async()=>{const io=new NodeIO();const doc=await io.read('b1.glb');
for(const tex of doc.getRoot().listTextures()){const slots=tex.listParents().map(p=>p.propertyType);
 const buf=await sharp(Buffer.from(tex.getImage())).jpeg({quality:84}).toBuffer();
 tex.setImage(new Uint8Array(buf)).setMimeType('image/jpeg');}
await io.write('barra_jpg.glb',doc);})();
