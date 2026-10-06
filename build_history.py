from pathlib import Path
import json, shutil, math
from PIL import Image, ImageDraw, ImageFont, ImageOps

root=Path(__file__).parent
review=root/'review'
early=review/'early'
early.mkdir(exist_ok=True)
desktop=root.parent
items=[]
def add(name,file,note): items.append(dict(name=name,file=file,note=note))
shutil.copyfile(desktop/'15262825933_83fd606cc1_b.jpg',early/'original-photo.jpg')
add('01 原始夜景照片','early/original-photo.jpg','劇院、水池倒影與夜間窗光')
add('02 水彩參考作品','reference.png','後續重建的指定參考圖')
for title,source,dest,note in [
 ('早期夜景重構','Watercolor-Nightscape/preview.png','nightscape.png','幾何輪廓與透明色塊；構圖簡化'),
 ('原圖顯現與手部模擬試作','Theater-Watercolor-Animation/preview.png','reveal-study.png','當時的 47% 進度截圖；後續改採逐筆重建'),
 ('程序水彩試作','Theater-Watercolor-Animation/preview-generated.png','generated.png','增加不規則色塊與紙面顆粒'),
 ('墨線階段試作','Theater-Watercolor-Animation/preview-sketch.png','sketch.png','逐筆速寫的工具截圖'),
 ('濕材質研究','Theater-Watercolor-Study/preview.png','wet-study.png','局部濕染与材質試作的工具截圖'),
 ('墨線形式比較','Theater-Ink-Study/preview.png','ink-study.png','原短段筆觸與連續施力筆觸比較'),
 ('炭筆感試驗','Theater-Ink-Study/preview-charcoal.png','charcoal.png','曾試驗炭筆感，之後選擇保留原筆觸')]:
 shutil.copyfile(desktop/source,early/dest);add(title,'early/'+dest,note)
for i in range(1,8): add(f'手工重構・第 {i} 輪',f'painting-pass-{i}.png','劇院曲面、窗光、街景與倒影的逐輪調整')
for title,file,note in [
 ('向量第 1 輪','vector-first.png','RGB 色差 20.80；連通色區抽取'),
 ('向量第 2 輪','vector-second.png','RGB 色差 14.45；補回微粒與邊界'),
 ('向量第 3 輪','vector-third.png','RGB 色差 7.88；座標偏移修正'),
 ('256 色・四倍精度','vector-global-palette.png','RGB 色差 4.80；提高取樣精度'),
 ('色階間隔 8','vector-step-8.png','RGB 色差 1.75；補回細微色階'),
 ('色階間隔 4','vector-step-4.png','RGB 色差 0.83；縮小色階差距'),
 ('完整原始色階・完成版','vector-latest.png','RGB 色差 0；不同像素 0')]:add(title,file,note)
for t in [.17,.35,.5,.7,.85,1]:add(f'作畫階段 {round(t*100)}%',f'animation-{t}.png','完成版同一幅作品的實際畫布進度')
(review/'history-manifest.json').write_text(json.dumps(items,ensure_ascii=False,indent=2))
(review/'history-data.js').write_text('window.HistoryStages='+json.dumps(items,ensure_ascii=False,separators=(',',':'))+';')
font='/System/Library/Fonts/PingFang.ttc'
heading=ImageFont.truetype(font,38);titlefont=ImageFont.truetype(font,23);small=ImageFont.truetype(font,18)
cols=3;cell_w=600;cell_h=460;top=140
out=Image.new('RGB',(cols*cell_w,top+math.ceil(len(items)/cols)*cell_h),(238,232,222));d=ImageDraw.Draw(out)
d.text((28,25),'劇院水彩｜完整歷程比較',font=heading,fill=(64,58,50))
d.text((30,85),'照片與參考 → 早期試作 → 手工 7 輪 → 向量與色階改進 → 完成版作畫階段',font=small,fill=(117,102,87))
for i,v in enumerate(items):
 x=i%cols*cell_w+12;y=top+i//cols*cell_h
 d.rounded_rectangle((x,y,x+576,y+444),radius=8,fill=(250,247,238))
 im=Image.open(review/v['file']).convert('RGB');im=ImageOps.contain(im,(552,350),Image.Resampling.LANCZOS)
 out.paste(im,(x+12+(552-im.width)//2,y+12+(350-im.height)//2))
 d.text((x+12,y+372),v['name'],font=titlefont,fill=(64,58,50))
 d.text((x+12,y+411),v['note'],font=small,fill=(117,102,87))
out.save(review/'history-overview.png')
print({'stages':len(items),'size':out.size,'output':str(review/'history-overview.png')})
