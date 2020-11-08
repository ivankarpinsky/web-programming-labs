window.onload = async function () {
    // add one is ok

    let response2 = await fetch('http://localhost:3000/favourites');
    var towns = await response2.json();
    console.log(towns);
    // add one is ok

    let cookAgree = getCookie('agree');
    let agree = cookAgree ? true : confirm('Согласны ли вы предоставить данные о вашей геолокации');
    if (agree) {
        setCookie('agree', true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            let response = await fetch(`http://localhost:3000/weather/coordinates?lat=${position.coords.latitude}&lon=${position.coords.longitude}`);

            if (response.ok) {
                let json = await response.json();
                setCurrentWeather(json);

                console.log(json);
            } else {
                alert("Ошибка HTTP: " + response.status);
            }
        });
    } else {
        let response = await fetch(`http://localhost:3000/weather/city?q=Saint Petersburg`);
        if (response.ok) {
            let json = await response.json();
            setCurrentWeather(json);
            console.log(json);
        }
    }

    setFavoritesWeather();

    let newTownButton = document.getElementById('add-new-town-button');
    let newTownInput = document.getElementById('add-new-town-input');
    newTownButton.onclick = async (e) => {
        e.preventDefault();
        let response = await fetch('http://localhost:3000/favourites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({name: newTownInput.value})
        });
        if (!response.ok) {
            alert('Данный город уже есть в избранных');
        }
        location.reload();
    };
    let reloadButton = document.getElementById('reload-geo');
    reloadButton.onclick = function () {
        setCookie('agree', true, -1);
        location.reload();
    }
};

function setCurrentWeather(data) {
    let leftBlock = document.querySelector('#top-weather__left-block');
    let h3 = leftBlock.querySelector('h3');
    let img = leftBlock.querySelector('img');
    let degrees = leftBlock.querySelector('.big-degrees');
    h3.innerText = data.city.name;
    img.src = 'http://openweathermap.org/img/wn/' + data.list[0].weather[0].icon + '@4x.png';
    degrees.innerText = data.list[0].main.temp + '° C';

    let topRightBlock = document.querySelector("#top-weather__right-block");
    setCardInfo(topRightBlock, data);
    let preloader = document.querySelector('.preloader');
    preloader.classList.remove('preloader-visible');
    preloader.classList.add('preloader-hidden');
}

function setCardInfo(block, data) {
    let weather = data.list[0];
    let template = document.querySelector('#info-item-template');
    let name, value, clones = [];

    name = template.content.querySelector('.info-item__name');
    value = template.content.querySelector('.info-item__value');

    name.textContent = 'Ветер';
    value.textContent = `${weather.wind.speed} m/s, ${weather.wind.deg}°`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Облачность';
    value.textContent = `${weather.clouds.all}%`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Давление';
    value.textContent = `${weather.main.pressure} hpa`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Влажность';
    value.textContent = `${weather.main.humidity}%`;
    clones.push(document.importNode(template.content, true));

    name.textContent = 'Координаты';
    value.textContent = `[${data.city.coord.lat}, ${data.city.coord.lon}]`;
    clones.push(document.importNode(template.content, true));

    clones.forEach((item) => block.appendChild(item));
}

async function setFavoritesWeather() {
    let response3 = await fetch('http://localhost:3000/favourites');
    let towns = await response3.json();
    console.log(towns);
    if (towns == null) return;
    let favorites = document.querySelector('#favorite-towns');
    let clones = [];

    for (const townObj of towns) {
        let town = townObj.name;
        let response = await fetch(`http://localhost:3000/weather/city?q=${town}`);
        let townTemplate = document.querySelector('#city-weather-template');
        let emptyTown = townTemplate.cloneNode(true);
        let data, cityName, degrees, img, ul;

        if (response.ok) {
            data = await response.json();
            favorites.appendChild(document.importNode(emptyTown.content, true));
            cityName = townTemplate.content.querySelector('.top-block__city-name');
            degrees = townTemplate.content.querySelector('.degrees');
            img = townTemplate.content.querySelector('img');
            ul = townTemplate.content.querySelector('ul');
            ul.innerHTML = '';


            setCardInfo(ul, data);

            cityName.innerText = town;
            img.src = 'http://openweathermap.org/img/wn/' + data.list[0].weather[0].icon + '@2x.png';
            degrees.innerText = data.list[0].main.temp + '° C';
            let preloader = townTemplate.content.querySelector('.preloader');
            preloader.classList.remove('preloader-visible');
            preloader.classList.add('preloader-hidden');
            await sleep(500);
            favorites.removeChild(favorites.lastElementChild);
            favorites.appendChild(document.importNode(townTemplate.content, true));
            preloader.classList.add('preloader-visible');
            preloader.classList.remove('preloader-hidden');
        } else {
            favorites.appendChild(document.importNode(emptyTown.content, true));
            cityName = townTemplate.content.querySelector('.top-block__city-name');
            cityName.innerText = town;
            degrees = townTemplate.content.querySelector('.degrees');
            img = townTemplate.content.querySelector('img');
            ul = townTemplate.content.querySelector('ul');
            degrees.innerHTML = '';
            ul.innerHTML = '';
            img.src = '';


            let errorMessage = townTemplate.content.querySelector('.error-info');
            errorMessage.innerHTML = 'По данному городу не удалось загрузить данные с api';
            let preloader = townTemplate.content.querySelector('.preloader');
            preloader.classList.remove('preloader-visible');
            preloader.classList.add('preloader-hidden');
            await sleep(500);
            favorites.removeChild(favorites.lastElementChild);
            favorites.appendChild(document.importNode(townTemplate.content, true));
            errorMessage.innerHTML = '';
            preloader.classList.add('preloader-visible');
            preloader.classList.remove('preloader-hidden');
            console.log("Города нет в апи: " + town + '  ' + response.status);
        }
    }

    let deleteButtons = document.getElementsByClassName('delete-button');
    for (let j = 0; j < deleteButtons.length; j++) {
        deleteButtons[j].onclick = async (e) => {
            let cityName = deleteButtons[j].previousElementSibling.previousElementSibling.previousElementSibling;
            console.log(cityName);
            let response = await fetch('http://localhost:3000/favourites', {
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({name: cityName.innerText})
            });
            location.reload();
        };
    }
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}