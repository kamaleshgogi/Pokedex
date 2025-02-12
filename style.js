$(document).ready(function() {
    var apiUrl = "https://pokeapi.co/api/v2/pokemon/";
    var offset = 0;
    var limit = 50;
    var loading = false;

    loadData();

    $("#load-more").click(function() {
        loadData();
    });

    $("#search-button").click(function() {
        var query = $("#search-input").val().toLowerCase();
        searchPokemon(query);
    });

    function loadData() {
        if (loading) return;
        loading = true;

        var url = apiUrl + "?offset=" + offset + "&limit=" + limit;
        $.get(url, function(data) {
            $.each(data.results, function(index, pokemon) {
                createCard(pokemon);
            });
            offset += limit;
            loading = false;
        });
    }

    function createCard(pokemon) {
        $.get(pokemon.url, function(data) {
            var html = `
                <div class="col-lg-3 col-md-4 col-sm-6 d-flex justify-content-center">
                    <div class="card">
                        <img src="${data.sprites.other["official-artwork"].front_default}" alt="${data.name}">
                        <h2>${data.name}</h2>
                        <button class="btn btn-info popup-button" data-url="${pokemon.url}">View Details</button>
                    </div>
                </div>`;
            $("#card-container").append(html);

            $(".popup-button").click(function() {
                showPopup($(this).data("url"));
            });
        });
    }

    function showPopup(url) {
        $.get(url, function(data) {
            $("#popup-name").text(data.name);
            $("#popup-image").attr("src", data.sprites.other["official-artwork"].front_default);

            // Fetch category and bio
            $.get(data.species.url, function(speciesData) {
                var category = speciesData.genera.find(genus => genus.language.name === "en").genus;
                var bio = speciesData.flavor_text_entries.find(entry => entry.language.name === "en").flavor_text;
                $("#popup-category").text("Category: " + category);
                $("#popup-bio").html(bio.length > 150 ? bio.substring(0, 150) + '... <a href="#" id="view-more">View More</a>' : bio);

                // Fetch evolution chain
                $.get(speciesData.evolution_chain.url, function(evolutionData) {
                    var evolutionChain = getEvolutionChain(evolutionData.chain);
                    $("#popup-evolution").html(evolutionChain);
                });
            });

            var details = `
                <p>Height: ${data.height}</p>
                <p>Weight: ${data.weight}</p>
                <p>Category: <span id="popup-category"></span></p>
                <p>Abilities: ${data.abilities.map(a => a.ability.name).join(", ")}</p>
            `;
            $("#popup-details").html(details);

            $("#popup").modal('show');

            $("#catch-btn").click(function() {
                $("#catch-modal").modal('show');
                $("#catch-btn").text("🥳 Pokemon caught! 🎉").attr("disabled", true);
            });

            $("#release-btn").click(function() {
                $("#catch-btn").text("Catch").attr("disabled", false);
            });

            $(document).on('click', '#view-more', function(e) {
                e.preventDefault();
                $("#popup-bio").text(bio);
            });
        });
    }

    function getEvolutionChain(chain) {
        var evolutionChain = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${chain.species.url.split('/')[6]}.png" alt="${chain.species.name}">`;
        while (chain.evolves_to.length > 0) {
            chain = chain.evolves_to[0];
            evolutionChain += ` -> <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${chain.species.url.split('/')[6]}.png" alt="${chain.species.name}">`;
        }
        return evolutionChain;
    }

    function searchPokemon(query) {
        var url = apiUrl + query;
        $.get(url, function(data) {
            $("#card-container").empty();
            createCard(data);
        }).fail(function() {
            alert("Pokemon not found!");
        });
    }
});