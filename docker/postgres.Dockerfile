FROM postgres:16

# Compatibilidad con clientes que envian un timezone legacy:
# "America/Buenos_Aires" (el canonico es America/Argentina/Buenos_Aires).
RUN ln -snf /usr/share/zoneinfo/America/Argentina/Buenos_Aires /usr/share/zoneinfo/America/Buenos_Aires
