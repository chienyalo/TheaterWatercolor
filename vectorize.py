"""Compile reference into connected pigment regions, never a runtime bitmap."""
from pathlib import Path
import argparse, json, time
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
SOURCE = Path('/Users/alicialo/Downloads/劇院黃昏與水池倒影.png')
rgb = np.array(Image.open(SOURCE).convert('RGB'))
H, W = rgb.shape[:2]
parser=argparse.ArgumentParser()
parser.add_argument('--color-step',type=int,choices=[1,2,4,8],default=1)
COLOR_STEP=parser.parse_args().color_step

def region(x, y):
    if y >= 590: return 5
    if y >= 495: return 4
    if x < 462 and y > 85: return 1
    if x > 478 and y > max(0, 355 - (x-478)*.57): return 3
    return 0

def local_order(x,y):
    """A continuous traversal of nearby brush footprints, instead of a row wipe."""
    x=max(0,min(31,int(x//48)));y=max(0,min(31,int(y//48)))
    result=0;step=16
    while step:
        rx=int(bool(x&step));ry=int(bool(y&step))
        result+=step*step*((3*rx)^ry)
        if not ry:
            if rx: x=step-1-x;y=step-1-y
            x,y=y,x
        step//=2
    return result

def compile_layer(source, count, scale, epsilon, minimum):
    im = Image.fromarray(source).resize((round(W*scale), round(H*scale)), Image.Resampling.LANCZOS)
    if scale==1:
        yy,xx=np.indices((H,W)); zones=np.zeros((H,W),dtype=np.uint8)
        zones[(xx>478)&(yy>np.maximum(0,355-(xx-478)*.57))]=3
        zones[(xx<462)&(yy>85)]=1
        zones[yy>=495]=4;zones[yy>=590]=5
        # Retain close pigment shades instead of forcing every subject into 256 colors.
        # RGB bins have a configurable maximum span; their representative is the
        # actual mean pigment shade, with a separate vocabulary for each subject.
        levels=256//COLOR_STEP
        bins=source.astype(np.uint32)//COLOR_STEP
        codes=zones.astype(np.uint32)*levels**3+bins[:,:,0]*levels**2+bins[:,:,1]*levels+bins[:,:,2]
        _,inverse=np.unique(codes.reshape(-1),return_inverse=True)
        labels=inverse.reshape(H,W).astype(np.int32)
        frequencies=np.bincount(inverse)
        palette=np.column_stack([np.rint(np.bincount(inverse,weights=source[:,:,k].reshape(-1))/frequencies) for k in range(3)]).astype(np.uint8)
        target=palette[labels]
        (ROOT/'review/palette-fidelity.json').write_text(json.dumps({'color_step':COLOR_STEP,'palette_colors':len(palette),'RGB_MAE':float(np.abs(source.astype(float)-target).mean())},indent=2))
    else:
        quant = im.quantize(colors=count, method=Image.Quantize.MEDIANCUT)
        labels = np.array(quant)
        palette = np.array(quant.getpalette(), dtype=np.uint8).reshape(-1,3)[:count]
    marks = []
    factor=4 if scale==1 else 1
    # OpenCV accepts a 32-bit label map in RETR_CCOMP mode. Extract all pigment
    # contours in one pass rather than scanning the full image for every shade.
    if scale==1:
        label_grid=cv2.resize(labels+1,None,fx=factor,fy=factor,interpolation=cv2.INTER_NEAREST)
        all_contours,all_hierarchy=cv2.findContours(label_grid,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
        batches=[(None,all_contours,all_hierarchy)]
    else:
        batches=[]
        for color in np.unique(labels):
            mask=(labels==color).astype(np.uint8)
            contours,hierarchy=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
            batches.append((int(color),contours,hierarchy))
    for batch_color,contours,hierarchy in batches:
        if hierarchy is None: continue
        for i, contour in enumerate(contours):
            if hierarchy[0,i,3] >= 0: continue
            if batch_color is None:
                px,py=contour[0,0];color=int(label_grid[py,px])-1
                if color<0: continue
            else: color=batch_color
            area = cv2.contourArea(contour)/factor**2
            if area < minimum: continue
            rings = [contour]
            child = hierarchy[0,i,2]
            while child >= 0:
                rings.append(contours[child])
                child = hierarchy[0,child,0]
            segments=[]
            for ring in rings:
                points = cv2.approxPolyDP(ring, epsilon*factor, True).reshape(-1,2) / (scale*factor)
                if factor>1: points+=.5/factor
                if len(points)<3: continue
                segments.append('M'+'L'.join(','.join(f'{n:.3f}'.rstrip('0').rstrip('.') for n in p) for p in points)+'Z')
            if not segments: continue
            x,y,w,h = cv2.boundingRect(contour)
            cx,cy=(x+w/2)/(scale*factor)+(.5/factor if factor>1 else 0),(y+h/2)/(scale*factor)+(.5/factor if factor>1 else 0)
            marks.append([int(color), region(cx,cy), round(cx,1), round(cy,1), round(area/scale**2,2), ''.join(segments), round(w/(scale*factor),1), round(h/(scale*factor),1)])
    if scale==1:
        # Micro-granules form a dry-brush deposit, not hundreds of thousands of
        # separate fictional hand strokes. Group nearby grains of the same pigment.
        groups={}; broad=[]
        for mark in marks:
            if mark[4]>=16:
                broad.append(mark);continue
            key=(mark[0],mark[1],int(mark[2]//48),int(mark[3]//48))
            if key not in groups:
                groups[key]=[mark[0],mark[1],key[2]*48+24,key[3]*48+24,0,[],48,48]
            g=groups[key];g[4]+=mark[4];g[5].append(mark[5])
        for g in groups.values():
            g[4]=round(g[4],2);g[5]=''.join(g[5]);broad.append(g)
        marks=broad
    # Broad coats first, then small connected pigment pools, moving within each subject.
    if scale==1:
        marks.sort(key=lambda m:(m[1],0 if m[4]>=1000 else 1,local_order(m[2],m[3]),-m[4]))
    else:
        marks.sort(key=lambda m:(m[1], -int(np.log2(max(1,m[4]))), int(m[2]/100), m[3]))
    return {'palette':['#'+''.join(f'{int(c):02x}' for c in p) for p in palette], 'marks':marks, 'stroke':round(1/(scale*factor),2)}

start=time.time()
base=compile_layer(cv2.GaussianBlur(rgb,(0,0),3),48,.5,.6,2)
detail=compile_layer(rgb,256,1,.025,.20)
gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
# Dark ink boundaries: avoid tracing every watercolor grain as a black line.
dark=((gray<65)&(np.max(rgb,axis=2)-np.min(rgb,axis=2)<48)).astype(np.uint8)*255
edge=cv2.Canny(cv2.GaussianBlur(gray,(3,3),.65),65,140)
edge=cv2.bitwise_and(edge,cv2.dilate(dark,np.ones((3,3),np.uint8)))
contours,_=cv2.findContours(edge,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
ink=[]
for c in contours:
    if cv2.arcLength(c,False)<9: continue
    p=cv2.approxPolyDP(c,.65,False).reshape(-1,2)
    ink.append(p.tolist())
data={'width':W,'height':H,'layers':[base,detail],'ink':ink,'source':'Reference-derived vector reconstruction; inferred painting order.'}
(ROOT/'pigments.js').write_text('window.TheaterPigments='+json.dumps(data,separators=(',',':'))+';')
(ROOT/'review/vector-stats.json').write_text(json.dumps({'base_regions':len(base['marks']),'detail_regions':len(detail['marks']),'ink_paths':len(ink),'elapsed':time.time()-start},indent=2))
print((ROOT/'review/vector-stats.json').read_text())
