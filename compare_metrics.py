from pathlib import Path
from PIL import Image
import numpy as np
import json

root=Path(__file__).parent
source=Image.open(root/'review/reference.png').convert('RGB')
a=np.array(source,dtype=float)
regions={'theater':(710,40,1430,560),'city':(0,75,490,580),'pool':(470,560,1460,1005)}
reports={}
for filename in ['painting-pass-7.png','vector-first.png','vector-second.png','vector-third.png','vector-latest.png']:
    im=Image.open(root/'review'/filename).convert('RGB'); b=np.array(im,dtype=float)
    error=np.abs(a-b)
    reports[filename]={'RGB_MAE':float(error.mean()),'RGB_RMSE':float(np.sqrt(np.mean((a-b)**2))), 'regions':{}}
    for name,(x,y,xx,yy) in regions.items():
        reports[filename]['regions'][name]=float(error[y:yy,x:xx].mean())
        if filename=='vector-latest.png':
            pair=Image.new('RGB',((xx-x)*2,yy-y));pair.paste(source.crop((x,y,xx,yy)),(0,0));pair.paste(im.crop((x,y,xx,yy)),(xx-x,0));pair.save(root/'review'/f'vector-compare-{name}.png')
(root/'review/fidelity.json').write_text(json.dumps(reports,indent=2))
print(json.dumps(reports,indent=2))
