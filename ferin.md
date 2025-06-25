Ferin Lang Prototype
- Easy build for Web & App projects

Project Structure
/project
  /src
    main.ferin
  package.json

package.json 매니페스트 내에서 ferin, ferin dev, ferin build 등의 cli 커맨드로 실행

타입은 기본적으로 typescript 기반으로 동작

ferin --target=web|app에 따라서 electron app, web host로 실행
dev 커맨드는 양측 hot reload 지원
build 커맨드는 app측은 electron-builder로 설치파일 빌드, web측은 html,js,css bundle 빌드

```ferin
# 주석 표기

var x: number = 0 # var 변수명: 타입 = 값 (타입은 선택적, 자동 추론 필요)
# 타입은 ts 기본 string, number, boolean, null, undefined, array, object 등 사용 가능

fn func1(arg1: number, arg2: string = "test"): # fn 함수명(인자: 인자타입 = 미정의 값):
  ret arg1.toString() + arg2 # 들여쓰기로 스코프 구분

# js/ts가 가지고 있는 타입들의 기본적 메서드는 모두 동일하게 사용 가능
var arr: number[] = [1, 2, 3, 4, 5, 6]
var new_arr = arr.map((v, i): v ** 2) # () -> returnValue 식의 람다 표현식은 (): return_value 로 바뀜

fn for_loop(v, i):
  log(v, i) # 출력로깅

new_arr.forEach(for_loop) # 화살표 함수를 사용할 수 없기에, forEach같은 경우에는 한줄 코드가 되거나, 함수를 따로 지정해줘야함
# 그렇기에 배열 순회가 필요하다면 for문을 사용할 것을 권장
for (v, i) in new_arr :
  log(v, i)

while true: # js/ts 와 같이 블로킹 루프임
  pass

loop : # 논블로킹 루프를 사용하려면 loop를 써야함
  if condition : break

if cond1 && cond2 || !cond3 : # and, or, not 등의 조건 연산자는 js 기준에 따름
  log(`success ${cond1}`) # string 포맷팅도 js를 따름

import module_name from "module_path" # 기본 import
import { func1, func2 } from "module_path" # named import
import * as module_name from "module_path" # namespace import

export func1 # 기본 export
export { func1, func2 } # named export
export * as module_name # namespace export
export default func1 # default export

import {typesFunction} from "util/index" # 기본적으로 ts, js파일 내의 변수, 함수, 클래스 등을 호환하여 import 할 수 있음

# 함수 호출
func1(1, arg2="test") # 인자명으로 호출 가능
module_name.func2(2, "test")

# 클래스

class Test:
  x: number = 0 # 필드 선언
  private y: number = 0 # private 필드 선언

  fn init(x: number): # 생성자
    self.x = x

  fn func1(arg1: number, arg2: string): # 메서드
    ret arg1.toString() + arg2

  static fn static_func1(arg1: number, arg2: string): # static 메서드
    ret arg1.toString() + arg2

var test = Test(1)
test.func1(1, "test")
test.x = 1 # 필드 접근
Test.static_func1(1, "test")

# 상속
class Test2(Test):
  fn func1(arg1: number, arg2: string):
    ret super.func1(arg1, arg2)

# 타입 정의
type TestType = string | number
enum TestEnum {
  A = 1,
  B = 2,
  C = 4
}
struct TestStruct {
  x: number
  y: number
}

class Test3 implements TestStruct:
  x: number
  y: number

  fn init(x?: number, y?: number):
    self.x = x
    self.y = y

  fn add():
    ret self.x + self.y

var test3 = Test3(x=1, y=2)
test3.add()

# 타입 추론
var x = 1 # number
var y = "test" # string
var z = true # boolean
var w = null # null
var v = undefined # undefined
var arr = [1, 2, 3, 4, 5, 6] # number[]
var obj = { x: 1, y: 2 } # { x: number, y: number }

var [x, y] = arr # 배열 구조분해
var { x, y } = obj # 객체 구조분해

# web 렌더러

/div # html 태그
/div
  /h1 "Title" # 들여쓰기로 부모자식 관계 구분
  /p "Description"

/div flex-row justify-center gap-1 # tailwind css 지원
  /div "Left"
  /div "Right"
  /input value="test" # property define
  /input value={x} # data binding
  # value, isChecked 같이 사용자가 상호작용하여 변경되는 property는 따로 onChange로 data 변경을 안해도 알아서 변경됨
  /input onChange={func1} # event binding
  /select value="opt1" border-red-500
    /option value="opt1" "Option 1" # innerContent 위치 상관 X
    /option "Option 2" value="opt2" # value, tailwindcss 가 아닌 인자는 innerContent
    "아무것도 없는 상태"

# 변환하면 아래와 같음
<div class="flex-row justify-center gap-1">
  <div>Left</div>
  <div>Right</div>
  <input value="test" />
  <select value="opt1" border-red-500>
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
  </select>
  아무것도 없는 상태
</div>

/div absolute p-1 m-2
  /button "Click" onClick={func1} # event binding
  /p "count: {clicked}" # string interpolation
  /div bg-{theme == "dark" ? "black" : "white"} "Content" # 조건부 스타일링

/div
  /if {condition} # 조건부 렌더링
    /div "If"
  /else if {condition}
    /div "Else If"
  /else
    /div "Else"
  
  /for [v, i] of {arr} # 배열 순회
    /div "{v}" # string interpolation
  /for [k, v] of {obj} # 객체 순회
    /div "{k}: {v}" # string interpolation

# 컴포넌트
comp Section(props, children):
  var computed_state = props.name + "!!" # 기본적으로 모든 var로 선언된 변수는 reactive임.
  ret /div "Section"
    /span "{computed_state}"
    {children}

/Section name="Section 1"
  /p "Description"

# 스타일 바인딩
var styleSet = {
  color: "red",
  backgroundColor: "black",
}

/div style={styleSet}
/div style={{color: "red", backgroundColor: "black"}} # inline style

# Electron App
import { Window, process } from "std/app"

ref canvas_ref
var main_screen = /div "Main Screen"
var overlay_screen = /canvas ref={canvas_ref}

var main_window = Window() # window creation
var overlay = Window({ # Electron window options
  width: 200,
  height: 200,
  x: 0,
  y: 0,
  transparent: true,
  focusable: false,
})

main_window.load(main_screen) # render element 지정하여 load
overlay.load(overlay_screen)

var ctx = canvas_ref.current.getContext("2d")

async fn main():
  await process.mount(main_window)
  await process.mount(overlay)

  loop {
    ctx.clearRect(0, 0, 200, 200)
    ctx.fillRect(0, 0, 200, 200)
  }

try:
  main()
catch e:
  log(e)
finally:
  process.exit()

```

기본적으로 ferin cli는
```sh
ferin target.ferin
```
를 실행하여 electron app을 실행하거나, 웹을 호스트함.

ferin build로 빌드하면 기본적으로 /dist 폴더에 타겟에 따라 앱 설치 파일, 웹 bundle 파일이 저장됨

web은 파일에서 마지막으로 ret 리턴된 /Comp 컴포넌트를 기준으로 html,css,js 번들을 생성함
파일 내에서 return 되는 컴포넌트가 없으면 컴파일 에러

app은 process.mount() 메서드로 하나 이상의 window를 mount해야 실행 가능함
파일 내에서 mount되는 window가 없으면 컴파일 에러