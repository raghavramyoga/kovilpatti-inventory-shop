using FluentValidation;
using FluentValidation.Results;
using KovilpattiSnacks.Business.DTOs.Products;
using KovilpattiSnacks.Business.Exceptions;
using KovilpattiSnacks.Business.Interface;
using KovilpattiSnacks.Repository.Entities;
using KovilpattiSnacks.Repository.Interface;
using ValidationException = KovilpattiSnacks.Business.Exceptions.ValidationException;

namespace KovilpattiSnacks.Business.Implementation;

public class ProductService(
    IProductRepository products,
    ICategoryRepository categories,
    ICurrentUser currentUser,
    IValidator<CreateProductRequest> createValidator,
    IValidator<UpdateProductRequest> updateValidator
) : IProductService
{
    public async Task<IReadOnlyList<ProductDto>> ListAsync(string? search, int? categoryId, CancellationToken ct = default)
    {
        var rows = await products.ListAsync(search, categoryId, ct);
        return rows.Select(MapToDto).ToList();
    }

    public async Task<ProductDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var p = await products.GetAsync(id, ct)
            ?? throw new NotFoundException($"Product '{id}' not found.");
        return MapToDto(p);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken ct = default)
    {
        var validation = await createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid) throw new ValidationException(validation.Errors);

        if (!await categories.ExistsAsync(request.CategoryId, ct))
            throw new NotFoundException($"Category '{request.CategoryId}' not found.");

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? await products.NextCodeAsync(ct)
            : request.Code.Trim();

        if (await products.ExistsByCodeAsync(code, ct))
            throw new ValidationException(new[]
            {
                new ValidationFailure(nameof(request.Code), $"Code '{code}' already exists.")
            });

        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authenticated user required.");

        var product = new Product
        {
            Code           = code,
            Name           = request.Name.Trim(),
            CategoryId     = request.CategoryId,
            Type           = request.Type.Trim(),
            WeightValue    = request.WeightValue,
            WeightUnit     = request.WeightUnit ?? "g",
            Mrp            = request.Mrp,
            PurchasePrice  = request.PurchasePrice,
            Active         = request.Active
        };

        var newId = await products.CreateAsync(product, userId, ct);
        return await GetAsync(newId, ct);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct = default)
    {
        var validation = await updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid) throw new ValidationException(validation.Errors);

        var existing = await products.GetAsync(id, ct)
            ?? throw new NotFoundException($"Product '{id}' not found.");

        if (existing.CategoryId != request.CategoryId &&
            !await categories.ExistsAsync(request.CategoryId, ct))
            throw new NotFoundException($"Category '{request.CategoryId}' not found.");

        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authenticated user required.");

        var updated = new Product
        {
            Id             = id,
            Code           = existing.Code,
            Name           = request.Name.Trim(),
            CategoryId     = request.CategoryId,
            Type           = request.Type.Trim(),
            WeightValue    = request.WeightValue,
            WeightUnit     = request.WeightUnit ?? "g",
            Mrp            = request.Mrp,
            PurchasePrice  = request.PurchasePrice,
            Active         = request.Active
        };

        var ok = await products.UpdateAsync(updated, userId, ct);
        if (!ok) throw new NotFoundException($"Product '{id}' not found.");

        return await GetAsync(id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Authenticated user required.");

        var ok = await products.SoftDeleteAsync(id, userId, ct);
        if (!ok) throw new NotFoundException($"Product '{id}' not found.");
    }

    private ProductDto MapToDto(Product p)
    {
        var hidePurchase = string.Equals(currentUser.Role, "ShopUser", StringComparison.OrdinalIgnoreCase);
        return new ProductDto(
            Id:            p.Id,
            Code:          p.Code,
            Name:          p.Name,
            CategoryId:    p.CategoryId,
            CategoryName:  p.CategoryName,
            Type:          p.Type,
            WeightValue:   p.WeightValue,
            WeightUnit:    p.WeightUnit,
            Mrp:           p.Mrp,
            PurchasePrice: hidePurchase ? null : p.PurchasePrice,
            Active:        p.Active
        );
    }
}
