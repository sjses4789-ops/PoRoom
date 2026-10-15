"""PoRoom 데스크탑 프로그램 실행:  python run.py   (로그인 없이 화면만 보기: python run.py --preview)"""
import sys

from poroom.app import main

if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
