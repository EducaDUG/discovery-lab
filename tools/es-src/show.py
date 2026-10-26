import json,sys
name,a,b=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
k=json.load(open(name+'.keys.json',encoding='utf8'))
print(len(k))
for i,s in enumerate(k[a:b],a): print(f'{i}|{s}')
