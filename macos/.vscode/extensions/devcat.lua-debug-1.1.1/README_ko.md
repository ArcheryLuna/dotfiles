# 소개

Lua Debugger 익스텐션을 사용해서 Visual Studio Code로 Lua 프로그램을 디버깅할 수 있습니다.


# 요구 사항

- 디버깅 대상이 될 Lua 프로그램에서 `luasocket` 을 쓸 수 있어야 합니다.
- 디버깅 대상이 될 Lua 프로그램에서 JSON 라이브러리를 쓸 수 있어야 합니다.  
`cjson`과 `dkjson`을 권장하지만, 인터페이스가 호환되는 다른 JSON 라이브러리를 사용해도 됩니다.
- 여러분의 코드나 서드파티 라이브러리가 `debug.sethook`을 호출하지 않아야 합니다.



# 설정하기

Lua Debugger를 가지고 루아 프로그램을 디버깅하기 위해서는
디버깅 대상이 될 프로그램에 vscode-debuggee.lua 를 넣고 작동시켜야 합니다.  
mobdebug를 써보셨다면 익숙하실 것입니다.



## 디버거 연결

1. [vscode-debuggee.lua](https://github.com/devcat-studio/VSCodeLuaDebug/blob/master/debuggee/vscode-debuggee.lua)를 다운로드해서 프로젝트에 넣습니다.

2. 다음 코드를 모든 Lua 소스코드가 로드된 이후에 실행되도록 프로그램에 붙여넣으세요.
여러분이 어떤 JSON 라이브러리를 사용하는지에 따라 코드를 적절히 수정해야 할 수 있습니다.

```lua
local json = require 'dkjson'
local debuggee = require 'vscode-debuggee'
local startResult, breakerType = debuggee.start(json)
print('debuggee start ->', startResult, breakerType)
```

3. 디버깅할 프로그램이 있는 폴더를 Visual Studio Code에서 열고, `Ctrl-Shift-D`로 디버그 창을 열고, 디버깅 설정을 적절히 편집하세요.

4. 디버깅할 프로그램의 적절한 위치에 `F9`를 눌러 중단점을 설정하세요.

5. `F5` 키를 눌러 디버깅을 시작합니다.



## 에러가 발생했을 때 디버거로 진입하도록 설정하기

에러핸들링할 위치에 아래 코드를 붙여넣으세요.
```lua
xpcall(
    function()
        -- 실제 실행될 코드
        local a = 1 + nil
    end,
    function(e)
        if debuggee.enterDebugLoop(1, e) then
            -- ok
        else
            -- 디버거가 붙어있지 않으면 여기로 진입합니다.
            print(e)
            print(debug.traceback())
        end
    end)
```


## 실행 도중에 디버그 명령을 처리할 수 있도록 설정하기

Lua 프로그램이 작동중인 상태에서도 일시정지나 중단점 설정 등 디버거의 명령에 반응하게 하려면 아래 코드를 적절한 간격으로 호출되도록 설정하세요.

게임 클라이언트라면 매 프레임마다 호출하면 됩니다.

```lua
debuggee.poll()
```


# Gideros 지원

Gideros Player를 Visual Studio Code에서 직접 실행할 수 있습니다.  
디버깅 설정의 'launch-gideros' 항목을 참고하세요.


# 리모트 디버깅 / 직접 실행

디버깅 설정을 `wait`으로 설정하고 디버깅을 시작하면, Visual Studio Code가 디버그 대상을 실행하지 않고 접속해올 때까지 기다립니다.
디버깅 대상이 콘솔에 남기는 문자열을 확인하고 싶거나, 디버거와 디버깅 대상이 서로 다른 장비에서 실행되어야 할 때 유용합니다.


# OP_HALT 패치

`vscode-debuggee.lua`는 기본적으로 `debug.sethook`을 이용해서 중단점 기능을 구현했기 때문에 Lua 프로그램 실행 속도를 크게 떨어뜨립니다. 이런 성능 저하는 Lua VM에 간단한 패치를 적용함으로써 극복할 수 있습니다.

다운로드:
* lua 5.1.5 : [패치](https://github.com/devcat-studio/lua-5.1.5-op_halt/blob/master/op_halt.patch), [소스코드](https://github.com/devcat-studio/lua-5.1.5-op_halt)

* lua 5.3.4 : [패치](https://github.com/devcat-studio/lua-5.3.4-op_halt/blob/master/op_halt.patch), [소스코드](https://github.com/devcat-studio/lua-5.3.4-op_halt)

# 감사의 말

- `OP_HALT` 패치는 [루아 메일링 리스트에 언급된 작업](http://lua-users.org/lists/lua-l/2010-09/msg00989.html)
에 크게 의존하고 있습니다. Dan Tull님께 감사드립니다.


- 디버거와 디버깅 대상이 연결하는 방법에 대한 아이디어를 [`mobdebug`](https://github.com/pkulchenko/MobDebug)로부터 얻었습니다. Paul Kulchenko님께 감사드립니다.




# vscode-debuggee.lua 레퍼런스

## debuggee.start(jsonLib, config)
디버거와 연결합니다. `jsonLib`은 `.encode`, `.decode` 함수가 포함된 JSON 라이브러리입니다.  
`config.onError`는 `vscode-debuggee` 모듈 안에서 에러가 발생했을 때 전달받기 위한 콜백입니다.  
`config.connectTimeout`, `config.controllerHost`, `config.controllerPort`는 리모트 디버깅을 위한 설정입니다.  
`config.redirectPrint` 를 `true`로 하면 `print` 호출을 가로채어 Visual Studio Code의 출력창에 표시합니다. Gideros를 사용할 때 중단점 직전에 호출한 `print`의 결과가 정상적으로 나오게 하려면 이 항목을 사용하십시오.

`debuggee.start`는 두 개의 값을 리턴합니다. 첫번째 리턴값은 디버거에 정상적으로 연결했을 경우 `true`이고, 그렇지 않으면 `false`입니다. 두번째 리턴값은 현재 루아 VM에 `OP_HALT` 패치가 되어있으면 `'halt'`, 아니면 `'pure'` 입니다.

## debuggee.poll()
쌓인 디버깅 명령을 처리하고 즉시 리턴합니다.

## debuggee.enterDebugLoop(depth[, what])
Lua 프로그램의 실행을 중단하고 현재 위치에서 디버깅을 시작합니다.  
`depth`는 디버거에서 현재 실행중인 것으로 나타낼 스택의 상대적인 깊이를 지정합니다. 0으로 설정하면 `debuggee.enterDebugLoop`을 호출한 위치이며, 1로 설정하면 그보다 한 단계 얕은 위치입니다.  
`what`은 디버깅을 시작하면서 Visual Studio Code에 전달할 메시지입니다.  

## debuggee.print(category, ...)
vscode에 콘솔 로그를 출력합니다.
`category`로 출력할 문장의 색을 바꿀 수 있습니다. `log`, `warning`, `error` 중 하나를 선택할 수 있습니다.
