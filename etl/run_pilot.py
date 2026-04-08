from db import init_db
from fetch_dolar import main as fetch_dolar_main
from fetch_emae import main as fetch_emae_main
from fetch_inflacion import main as fetch_inflacion_main


def main() -> None:
  init_db()
  fetch_inflacion_main()
  fetch_dolar_main()
  fetch_emae_main()
  print("pilot refresh done: inflacion, dolar_oficial, emae")


if __name__ == "__main__":
  main()
