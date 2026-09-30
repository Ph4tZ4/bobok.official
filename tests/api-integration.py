"""Run against an isolated database: BOBOK_TEST_URL=http://127.0.0.1:8080 python3 tests/api-integration.py"""
import os, json, urllib.request, urllib.error, http.cookiejar
base=os.environ.get('BOBOK_TEST_URL')
if not base: raise SystemExit('Set BOBOK_TEST_URL to an isolated test API (test creates records).')
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def api(route,data=None,csrf=None):
 headers={'Content-Type':'application/json'}
 if csrf: headers['X-CSRF-Token']=csrf
 request=urllib.request.Request(base+'/api/index.php?route='+route,data=json.dumps(data).encode() if data is not None else None,headers=headers)
 try:
  with client.open(request) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
assert api('admin/inquiries')[0]==401
assert api('inquiries',{'name':'Incomplete'})[0]==422
payload=dict(name='API Test',company='Test',email='test@example.com',phone='',service='Web Application',message='Integration test inquiry',consent='on')
assert api('inquiries',payload)[0]==201
session=api('session')[1]
assert api('login',{'email':'admin@example.com','password':'TestOnlyPassword123!'})[0]==403
code,result=api('login',{'email':'admin@example.com','password':'TestOnlyPassword123!'},session['csrf'])
assert code==200,(code,result)
csrf=result['csrf']
code,result=api('admin/inquiries');assert code==200 and result['total']>0
item=result['items'][0]
assert api('admin/status',{'id':item['id'],'status':'contacted'},csrf)[0]==200
assert api('admin/inquiries')[1]['items'][0]['status']=='contacted'
assert api('admin/content',{'content':{'hero_heading':'Integration heading'}},csrf)[0]==200
assert api('content')[1]['content']['hero_heading']=='Integration heading'
assert api('admin/content',{'content':{'hero_heading':''}},csrf)[0]==200
assert api('logout',{},csrf)[0]==200
assert api('admin/inquiries')[0]==401
print('PASS: validation, persistence, login, CSRF, authorization, status, content, logout')
