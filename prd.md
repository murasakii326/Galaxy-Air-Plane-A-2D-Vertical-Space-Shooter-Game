# PRD - 갤러그 스타일 우주 슈팅 게임

## 1. 프로젝트 개요

### 프로젝트명

Galaxy Fighter (가칭)

### 목적

고전 갤러그(Galaga) 스타일의 2D 아케이드 슈팅 게임을 구현한다.
플레이어는 우주 전투기를 조종하여 적 비행기를 격추하고 높은 점수를 획득하는 것이 목표이다.

---

# 2. 게임 컨셉

### 장르

* 아케이드
* 슈팅
* 우주 전투

### 플레이 방식

* 플레이어는 화면 하단에서 비행기를 좌우로 이동
* 적 비행기는 화면 상단에서 등장
* 플레이어는 미사일을 발사하여 적을 격추
* 적은 다양한 패턴으로 공격
* 충돌 시 폭발 애니메이션 재생
* 점수 시스템 제공

---

# 3. 주요 기능 요구사항

## 3.1 플레이어 비행기

### 기능

* 좌우 이동
* 미사일 발사
* 생명(HP 또는 목숨) 보유

### 조작

PC:

* ← : 왼쪽 이동
* → : 오른쪽 이동
* Space : 미사일 발사

모바일:

* 좌우 드래그 이동
* 발사 버튼

### 자산

플레이어 비행기 이미지

* 파일명: player_ship.png
* 크기: 64x64px
* 배경 투명 PNG

---

## 3.2 적 비행기

### 기능

* 상단에서 등장
* 지정된 패턴으로 이동
* 일정 시간마다 공격

### 종류

#### Enemy Type A

* 일반 적
* HP 1

#### Enemy Type B

* 중급 적
* HP 2

#### Enemy Boss

* 보스
* HP 20

### 자산

파일:

* enemy_a.png
* enemy_b.png
* enemy_boss.png

---

## 3.3 미사일 시스템

### 플레이어 미사일

특징:

* 위쪽 방향 발사
* 적 충돌 시 제거

자산:

* missile_player.png

사운드:

* missile_fire.wav

---

## 3.4 적 미사일

특징:

* 아래 방향 발사
* 플레이어 충돌 시 데미지

자산:

* missile_enemy.png

사운드:

* enemy_fire.wav

---

## 3.5 충돌 감지

감지 대상

* 플레이어 미사일 ↔ 적
* 적 미사일 ↔ 플레이어
* 적 ↔ 플레이어

결과

적 피격:

* HP 감소
* 폭발 애니메이션 실행
* 폭발 사운드 재생

플레이어 피격:

* HP 감소
* 피격 효과

---

## 3.6 폭발 효과

### 애니메이션

파일:

* explosion.gif

프레임 수:

* 12~24 프레임

재생시간:

* 0.5초

효과:

* 적 제거 시 실행
* 플레이어 파괴 시 실행

### 사운드

파일:

* explosion.wav

효과:

* 폭발 시 재생

---

# 4. UI 구성

## 시작 화면

표시 항목

* 게임 로고
* Start 버튼
* Exit 버튼

---

## 게임 화면

표시 항목

상단:

* 현재 점수
* 최고 점수
* 남은 목숨

중앙:

* 플레이 영역

하단:

* 플레이어 비행기

---

## 게임 오버 화면

표시 항목

* GAME OVER
* 최종 점수
* Restart 버튼

---

# 5. 게임 규칙

## 점수 시스템

Enemy A 제거:
+100점

Enemy B 제거:
+300점

Boss 제거:
+5000점

---

## 승리 조건

* 모든 적 제거
  또는
* 보스 격파

---

## 패배 조건

* 플레이어 목숨 0
* 플레이어 HP 0

---

# 6. 사운드 요구사항

## 배경음악

파일:

* bgm_space.mp3

특징:

* SF 분위기
* 반복 재생

---

## 효과음

| 이벤트     | 파일                   |
| ------- | -------------------- |
| 미사일 발사  | missile_fire.wav     |
| 적 발사    | enemy_fire.wav       |
| 적 폭발    | explosion.wav        |
| 플레이어 폭발 | player_explosion.wav |
| 게임 오버   | game_over.wav        |

---

# 7. 기술 요구사항

## 플랫폼

* Web Browser
* Desktop

## 권장 기술 스택

Frontend:

* HTML5
* CSS3
* JavaScript ES6

게임 엔진:

* Phaser 3

대안:

* PixiJS
* Canvas API

---

# 8. 성능 요구사항

FPS:

* 60FPS 유지

로딩 시간:

* 3초 이하

동시 객체 수:

* 적 50개 이상

---

# 9. 에셋 목록

## 이미지

player_ship.png

enemy_a.png

enemy_b.png

enemy_boss.png

missile_player.png

missile_enemy.png

background_space.jpg

logo.png

---

## 애니메이션

explosion.gif

---

## 사운드

bgm_space.mp3

missile_fire.wav

enemy_fire.wav

explosion.wav

player_explosion.wav

game_over.wav

---

# 10. 향후 확장 기능

* 파워업 아이템
* 2인 플레이
* 레이저 무기
* 실드 시스템
* 랭킹 서버
* 스테이지 시스템
* 보스 패턴 다양화
* 모바일 지원
* 게임패드 지원

---

# MVP 범위

필수 구현

✓ 플레이어 이동

✓ 적 생성

✓ 미사일 발사

✓ 충돌 판정

✓ 점수 시스템

✓ 폭발 GIF

✓ 폭발 사운드

✓ 게임 오버

✓ 재시작 기능

✓ BGM 재생
