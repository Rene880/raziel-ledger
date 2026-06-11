import json
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options

__Session = requests.Session()

def requestsGet(url, params = {}):
  # Getting 403 with default user agent as of 2024-03-15
  headers = {
    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0"
  }
  request = requests.Request(method='GET', url = url, params = params, headers = headers)
  r = request.prepare()
  print("Requests: " + r.url)

  s = __Session.send(request=r)
  if s.status_code != 200:
    print('Got status code', s.status_code, 'for', r.url)
  
  return s


def _getDriver():
  geckodriver_path = "/snap/bin/geckodriver"
  driver_service = webdriver.FirefoxService(executable_path=geckodriver_path)
  options = Options()
  options.set_preference("devtools.jsonview.enabled", False)
  return webdriver.Firefox(service=driver_service, options=options)

__Driver = _getDriver()

def seleniumGet(url, params = {}):

  full_url = url + '?'
  for key in params:
    full_url += str(key) + '=' + str(params[key]) + '&'
  print(f'Query: {full_url}')

  __Driver.get(full_url)
  
  return json.loads(__Driver.find_element(By.TAG_NAME, 'pre').text)

# https://gbf.wiki/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=File:
def getImageURL(image) -> str:
  time.sleep(.1) # Don't hammer the server
  request = seleniumGet(
    url = 'https://gbf.wiki/api.php',
    params = {
      'action': 'query',
      'prop': 'imageinfo',
      'iiprop': 'url',
      'format': 'json',
      'titles': 'File:' + image
    })
  request_json = request['query']['pages']
  try:
    return next(iter(request_json.values()))['imageinfo'][0]['url']
  except:
    print(request_json)
    raise
