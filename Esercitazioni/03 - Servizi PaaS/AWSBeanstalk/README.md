# Esercitazione PaaS: app Blazor e deploy su AWS Elastic Beanstalk

> **Obiettivo**: deployare un’app Blazor su un ambiente EB (Amazon Linux 2, piattaforma .NET) dietro un load balancer, con logging e variabili d’ambiente.

---

## 0) Prerequisiti

1. **Account AWS**
2. **Accesso alla Console AWS**
3. **.NET SDK 9** installato: [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)

---

## 1) Creazione del progetto Blazor

```bash
dotnet new list
dotnet new blazor -n AWSBeanstalk -f net9.0
cd AWSBeanstalk
```

---

## 2) Esecuzione locale

```bash
dotnet run
```

Aprire il browser (l’URL esatto appare in console) e verificare che l’app funzioni correttamente.

---

## 3) Preparare l’artifact ZIP

```bash
dotnet publish 'AWSBeanstalk.csproj' -c Release
cd bin/Release/net9.0/publish
```
Crereare un file ZIP con il contenuto della cartella `publish/`:

> Lo ZIP deve contenere **il contenuto** della cartella `publish/` (non la cartella stessa annidata).

---

## 4) Creazione applicazione ed ambiente **da Console AWS**

1. Aprire **Elastic Beanstalk** dalla Console AWS e cliccare **Create application**.
2. **Environment level**: tipo **Web server environment**
3. **Application name**: `BlazorOnEB`.
4. **Environment**: scegliere un **Environment name** (es. `BlazorOnEB-env`) e opzionalmente un **Domain**.
5. **Platform**: **.NET 9 running on 64bit Amazon Linux 2023** (o denominazione equivalente aggiornata).
6. **Application code**: scegliere **Upload your code** e caricare il **pacchetto ZIP pubblicato**. Il file ZIP deve contenere il contenuto della cartella `publish/` (DLL, wwwroot, ecc.). Specificare una versione del sorgente (es. `v1.0`).
7. Specificare il Preset `Single instance`
8. Nella configurazione dell'accesso al server, abilitare l'accesso SSH se si desidera connettersi all'istanza EC2 per il debug (opzionale).
9. Cliccare **Configure more options** per impostazioni avanzate:

    * **Capacity**: `Single instance` per demo; `Load balanced` per produzione.
    * **Instances**: tipo (es. `t3.micro`), **key pair** per SSH (opzionale), VPC/subnet.
    * **Load balancer**: Application Load Balancer; listener HTTP (e in seguito HTTPS).
    * **Rolling updates and deployments**: scegliere la policy (es. *Rolling* o *Immutable* in prod).
    * **Software**: aggiungere **Environment properties** (variabili d’ambiente), **Health check path** (es. `/healthz`).
    * **Monitoring**: abilitare log forwarding su CloudWatch (opz.).
10. Premere **Create environment** e attendere lo stato **Ready**.

> Se si preferisce caricare il codice dopo, è possibile creare l’ambiente con **Sample application** e poi usare **Upload and deploy** quando è disponibile lo ZIP di publish.
---