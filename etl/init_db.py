from db import init_db


def main() -> None:
  init_db()
  print("database schema ready")


if __name__ == "__main__":
  main()
